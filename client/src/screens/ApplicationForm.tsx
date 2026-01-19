import type { FormEvent } from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import Alert from 'react-bootstrap/Alert'
import Badge from 'react-bootstrap/Badge'
import Button from 'react-bootstrap/Button'
import Card from 'react-bootstrap/Card'
import Col from 'react-bootstrap/Col'
import Container from 'react-bootstrap/Container'
import Form from 'react-bootstrap/Form'
import Modal from 'react-bootstrap/Modal'
import Row from 'react-bootstrap/Row'
import Spinner from 'react-bootstrap/Spinner'
import Stack from 'react-bootstrap/Stack'
import Table from 'react-bootstrap/Table'
import { ApplicantSelectModal } from '../components/modals/ApplicantSelectModal'
import { CreateClientModal } from '../components/modals/CreateClientModal'
import { CreateHouseholdModal } from '../components/modals/CreateHouseholdModal'
import { HouseholdSelectModal } from '../components/modals/HouseholdSelectModal'
import { MemberSelectModal } from '../components/modals/MemberSelectModal'
import { UserSelectModal } from '../components/modals/UserSelectModal'
import { apiGet, apiPost } from '../api/http'
import { PhoneInput } from '../components/PhoneInput'
import { useDebouncedValue } from '../hooks/useDebouncedValue'
import { useApplicationDetails } from '../hooks/useApplicationDetails'
import { useApplicationMutations } from '../hooks/useApplicationMutations'
import { useClientDetails } from '../hooks/useClientDetails'
import { useClientMutations } from '../hooks/useClientMutations'
import { useHouseholdMutations } from '../hooks/useHouseholdMutations'
import { useHouseholdDetails } from '../hooks/useHouseholdDetails'
import { useUserDetails } from '../hooks/useUserDetails'
import type {
  ApplicationBillRequestInput,
  ApplicationBothCreatePayload,
  ApplicationHouseholdMemberInput,
  ProgramType,
  ApplicationDetails,
  ApplicationHouseholdMember,
  ApplicationBillRequest,
} from '../types/applications'
import type { AssistanceEventCreatePayload } from '../types/assistance'
import type { ClientListItem, ClientListResponse } from '../types/clients'
import type { HouseholdListItem, HouseholdListResponse } from '../types/households'
import type { UserListItem, UserListResponse } from '../types/users'

function toDateTimeLocal(value?: string | null) {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
  return local.toISOString().slice(0, 16)
}

type MemberState = ApplicationHouseholdMemberInput & {
  isApplicant?: boolean
  firstName?: string
  lastName?: string
}

type AssistanceDraft = {
  id: string
  programType: ProgramType | 'FoodPantry' | 'HelpingHands'
  occurredAt: string
  clientId?: string | null
  billType?: string | null
  amountPaid?: number | null
  checkNumber?: string | null
  notes?: string | null
  items: { itemType: string; quantity: number }[]
}

export function ApplicationForm() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()

  const hydratedForId = useRef<string | null>(null)

  const { isLoading, error } = useApplicationDetails(id, {
    onSuccess: (app: ApplicationDetails | undefined | null) => {
      if (!app) return
      if (hydratedForId.current === app.id) return
      hydratedForId.current = app.id

      setProgramType(app.programType as ProgramType)
      setDecisionStatus(app.decision || app.status || 'Submitted')
      setSubmittedAt(toDateTimeLocal(app.submittedAt))

      const [applicantFirst, ...applicantRest] = (app.applicantName ?? '').split(' ').filter(Boolean)
      setApplicant({
        id: app.applicantClientId,
        firstName: applicantFirst ?? '',
        lastName: applicantRest.join(' '),
        street1: undefined,
        city: undefined,
        state: undefined,
        zip: undefined,
        dob: undefined,
        phone: undefined,
      })

      setAssistClientId((prev) => prev ?? app.applicantClientId)

      setHousehold({
        id: app.householdId,
        street1: app.street1,
        street2: app.street2,
        city: app.city,
        state: app.state,
        zip: app.zip,
        memberCount: app.householdMembers.length,
        lastActivityAt: undefined,
      })

      setEmergencySummary(app.emergencySummary ?? '')
      setReceivedUtility(
        app.receivedUtilityAssistancePastYear === true
          ? 'yes'
          : app.receivedUtilityAssistancePastYear === false
            ? 'no'
            : '',
      )
      setUtilityAssistanceFrom(app.utilityAssistanceFrom ?? '')
      setPreventionPlan(app.preventionPlan ?? '')
      setReceivesFoodStamps(app.receivesFoodStamps === true ? 'yes' : 'no')
      setFoodStampsAmount(app.foodStampsAmount != null ? String(app.foodStampsAmount) : '')
      setFoodStampsDateAvailable(app.foodStampsDateAvailable ?? '')
      setLandlordName(app.landlordName ?? '')
      setLandlordPhone(app.landlordPhone ?? '')
      setLandlordAddress(app.landlordAddress ?? '')
      setVerifiedByUserId(app.verifiedByUserId ?? '')
      setDecisionDate(app.decisionDate ?? '')
      setBoardNotes(app.boardNotes ?? '')

      const members = app.householdMembers.map((m: ApplicationHouseholdMember) => {
        const [first, ...rest] = m.fullName.split(' ').filter(Boolean)
        return {
          clientId: m.clientId ?? '',
          fullName: m.fullName,
          dob: m.dob ?? '',
          relationshipToApplicant: m.relationshipToApplicant ?? (m.clientId === app.applicantClientId ? 'Self' : ''),
          incomeAmount: m.incomeAmount ?? undefined,
          incomeSource: m.incomeSource ?? '',
          isApplicant: m.clientId === app.applicantClientId,
          firstName: first,
          lastName: rest.join(' '),
        }
      })

      const ensureApplicant = members.some((m) => m.isApplicant)
        ? members
        : [
            {
              clientId: app.applicantClientId,
              fullName: app.applicantName ?? 'Applicant',
              dob: '',
              relationshipToApplicant: 'Self',
              incomeAmount: undefined,
              incomeSource: '',
              isApplicant: true,
              firstName: applicantFirst ?? '',
              lastName: applicantRest.join(' '),
            },
            ...members,
          ]

      setHouseholdMembers(ensureApplicant)

      setBillRequests(
        app.billRequests.map((b: ApplicationBillRequest) => ({
          billType: b.billType,
          amountRequested: b.amountRequested,
          accountNumber: b.accountNumber ?? '',
        })),
      )
    },
  })

  useEffect(() => {
    hydratedForId.current = null
  }, [id])
  const { create, createBoth, update } = useApplicationMutations()
  const { create: createClient } = useClientMutations()
  const { create: createHousehold } = useHouseholdMutations()

  const [programType, setProgramType] = useState<ProgramType>('HelpingHands')
  const [decisionStatus, setDecisionStatus] = useState('Submitted')
  const [submittedAt, setSubmittedAt] = useState(() => toDateTimeLocal(new Date().toISOString()))
  const [applicant, setApplicant] = useState<ClientListItem | null>(null)
  const [household, setHousehold] = useState<HouseholdListItem | null>(null)

  const [emergencySummary, setEmergencySummary] = useState('')
  const [receivedUtility, setReceivedUtility] = useState<'yes' | 'no' | ''>('')
  const [utilityAssistanceFrom, setUtilityAssistanceFrom] = useState('')
  const [preventionPlan, setPreventionPlan] = useState('')
  const [receivesFoodStamps, setReceivesFoodStamps] = useState<'yes' | 'no'>('no')
  const [foodStampsAmount, setFoodStampsAmount] = useState('')
  const [foodStampsDateAvailable, setFoodStampsDateAvailable] = useState('')
  const [landlordName, setLandlordName] = useState('')
  const [landlordPhone, setLandlordPhone] = useState('')
  const [landlordAddress, setLandlordAddress] = useState('')
  const [verifiedByUserId, setVerifiedByUserId] = useState('')
  const [decisionDate, setDecisionDate] = useState('')
  const [boardNotes, setBoardNotes] = useState('')

  const [assistanceDrafts, setAssistanceDrafts] = useState<AssistanceDraft[]>([])
  const [showAssistModal, setShowAssistModal] = useState(false)
  const [assistProgram, setAssistProgram] = useState<ProgramType>('HelpingHands')
  const [assistOccurredAt, setAssistOccurredAt] = useState(() => toDateTimeLocal(new Date().toISOString()))
  const [assistClientId, setAssistClientId] = useState<string | null>(null)
  const [assistBillType, setAssistBillType] = useState('')
  const [assistAmount, setAssistAmount] = useState('')
  const [assistCheckNumber, setAssistCheckNumber] = useState('')
  const [assistNotes, setAssistNotes] = useState('')
  const [assistItems, setAssistItems] = useState<Record<string, boolean>>({ FoodBox: true })
  const [assistOtherItem, setAssistOtherItem] = useState('')

  const [isSubmitting, setIsSubmitting] = useState(false)

  const [householdMembers, setHouseholdMembers] = useState<MemberState[]>([])
  const [billRequests, setBillRequests] = useState<ApplicationBillRequestInput[]>([
    { billType: 'Rent', amountRequested: 0, accountNumber: '' },
  ])

  const [formError, setFormError] = useState<string | null>(null)

  const [showApplicantModal, setShowApplicantModal] = useState(false)
  const [showHouseholdModal, setShowHouseholdModal] = useState(false)
  const [showMemberModal, setShowMemberModal] = useState(false)
  const [showCreateClientModal, setShowCreateClientModal] = useState(false)
  const [showCreateHouseholdModal, setShowCreateHouseholdModal] = useState(false)
  const [clientModalMode, setClientModalMode] = useState<'applicant' | 'member' | null>(null)
  const [householdManuallySelected, setHouseholdManuallySelected] = useState(false)

  const [verifierSearch, setVerifierSearch] = useState('')
  const debouncedVerifierSearch = useDebouncedValue(verifierSearch, 300)
  const [showVerifierModal, setShowVerifierModal] = useState(false)

  const [newClientFirstName, setNewClientFirstName] = useState('')
  const [newClientLastName, setNewClientLastName] = useState('')
  const [newClientDob, setNewClientDob] = useState('')
  const [newClientPhone, setNewClientPhone] = useState('')

  const [newHouseholdStreet1, setNewHouseholdStreet1] = useState('')
  const [newHouseholdStreet2, setNewHouseholdStreet2] = useState('')
  const [newHouseholdCity, setNewHouseholdCity] = useState('')
  const [newHouseholdState, setNewHouseholdState] = useState('TN')
  const [newHouseholdZip, setNewHouseholdZip] = useState('')

  const [clientSearch, setClientSearch] = useState('')
  const debouncedClientSearch = useDebouncedValue(clientSearch, 300)
  const [householdSearch, setHouseholdSearch] = useState('')
  const debouncedHouseholdSearch = useDebouncedValue(householdSearch, 300)

  const applicantDetails = useClientDetails(applicant?.id)
  const householdDetails = useHouseholdDetails(household?.id)
  const verifierDetails = useUserDetails(verifiedByUserId || undefined)

  const clientSearchQuery = useQuery({
    queryKey: ['clients', 'search', debouncedClientSearch],
    enabled: debouncedClientSearch.trim().length > 0,
    queryFn: () => {
      const params = new URLSearchParams()
      params.set('search', debouncedClientSearch.trim())
      params.set('page', '1')
      params.set('pageSize', '10')
      return apiGet<ClientListResponse>(`/clients?${params.toString()}`)
    },
  })

  const householdSearchQuery = useQuery({
    queryKey: ['households', 'search', debouncedHouseholdSearch],
    enabled: debouncedHouseholdSearch.trim().length > 0,
    queryFn: () => {
      const params = new URLSearchParams()
      params.set('search', debouncedHouseholdSearch.trim())
      params.set('page', '1')
      params.set('pageSize', '10')
      params.set('sort', 'lastActivityAt')
      return apiGet<HouseholdListResponse>(`/households?${params.toString()}`)
    },
  })

  const verifierSearchQuery = useQuery({
    queryKey: ['users', 'search', debouncedVerifierSearch],
    enabled: debouncedVerifierSearch.trim().length > 0,
    queryFn: () => {
      const params = new URLSearchParams()
      params.set('search', debouncedVerifierSearch.trim())
      params.set('page', '1')
      params.set('pageSize', '10')
      params.set('sort', 'displayName')
      return apiGet<UserListResponse>(`/users?${params.toString()}`)
    },
  })

  useEffect(() => {
    const householdSummary = applicantDetails.data?.household
    if (!householdSummary) return
    if (isEdit) return
    if (householdManuallySelected && household && household.id !== householdSummary.id) return

    // Avoid updating state if the household is already set to the same values
    if (
      household &&
      household.id === householdSummary.id &&
      household.street1 === householdSummary.street1 &&
      household.street2 === (householdSummary.street2 ?? undefined) &&
      household.city === householdSummary.city &&
      household.state === householdSummary.state &&
      household.zip === (householdSummary.zip ?? undefined) &&
      household.memberCount === householdMembers.length
    ) {
      return
    }

    setHousehold({
      id: householdSummary.id,
      street1: householdSummary.street1,
      street2: householdSummary.street2 ?? undefined,
      city: householdSummary.city,
      state: householdSummary.state,
      zip: householdSummary.zip ?? undefined,
      memberCount: householdMembers.length,
      lastActivityAt: null,
    })
  }, [applicantDetails.data, householdManuallySelected, householdMembers.length, isEdit])

  useEffect(() => {
    if (!householdDetails.data) return
    if (isEdit) return

    const applicantId = applicant?.id
    const membersFromHousehold: MemberState[] = householdDetails.data.members.map((m) => ({
      clientId: m.id,
      fullName: `${m.firstName} ${m.lastName}`.trim(),
      dob: m.dob ?? undefined,
      relationshipToApplicant: m.id === applicantId ? 'Self' : '',
      incomeAmount: undefined,
      incomeSource: '',
      isApplicant: m.id === applicantId,
      firstName: m.firstName,
      lastName: m.lastName,
    }))

    const ensureApplicant = applicantId && !membersFromHousehold.some((m) => m.clientId === applicantId)
      ? [
          {
            clientId: applicantId,
            fullName: `${applicant?.firstName ?? ''} ${applicant?.lastName ?? ''}`.trim() || 'Applicant',
            dob: applicant?.dob ?? undefined,
            relationshipToApplicant: 'Self',
            incomeAmount: undefined,
            incomeSource: '',
            isApplicant: true,
            firstName: applicant?.firstName,
            lastName: applicant?.lastName,
          },
          ...membersFromHousehold,
        ]
      : membersFromHousehold

    setHouseholdMembers(ensureApplicant)
  }, [householdDetails.data, applicant?.id, applicant?.firstName, applicant?.lastName, applicant?.dob, isEdit])

  useEffect(() => {
    if (applicant?.id) {
      setAssistClientId((prev) => prev ?? applicant.id)
    }
  }, [applicant?.id])

  const resetNewClientForm = () => {
    setNewClientFirstName('')
    setNewClientLastName('')
    setNewClientDob('')
    setNewClientPhone('')
  }

  const resetNewHouseholdForm = () => {
    setNewHouseholdStreet1('')
    setNewHouseholdStreet2('')
    setNewHouseholdCity('')
    setNewHouseholdState('TN')
    setNewHouseholdZip('')
  }

  const resetAssistForm = (program?: ProgramType) => {
    const nextProgram = program ?? assistProgram
    setAssistProgram(nextProgram)
    setAssistOccurredAt(toDateTimeLocal(new Date().toISOString()))
    setAssistClientId((prev) => prev ?? applicant?.id ?? householdMembers[0]?.clientId ?? null)
    setAssistBillType('')
    setAssistAmount('')
    setAssistCheckNumber('')
    setAssistNotes('')
    setAssistItems(nextProgram === 'FoodPantry' ? { FoodBox: true } : {})
    setAssistOtherItem('')
  }

  const openAssistModal = (program: ProgramType) => {
    resetAssistForm(program)
    setShowAssistModal(true)
  }

  const handleAddAssistanceDraft = (e: FormEvent) => {
    e.preventDefault()
    if (!household) {
      setFormError('Select an applicant and household before adding assistance.')
      return
    }

    const id = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2)
    const items = assistProgram === 'FoodPantry'
      ? (() => {
          const selected = Object.entries(assistItems)
            .filter(([, checked]) => checked)
            .map(([key]) => ({ itemType: key, quantity: 1 }))
          const other = assistOtherItem.trim()
          if (other) selected.push({ itemType: `Other: ${other}`, quantity: 1 })
          return selected.length ? selected : [{ itemType: 'FoodBox', quantity: 1 }]
        })()
      : []

    const draft: AssistanceDraft = {
      id,
      programType: assistProgram,
      occurredAt: assistOccurredAt,
      clientId: assistClientId || applicant?.id || null,
      billType: assistBillType || null,
      amountPaid: assistAmount ? Number(assistAmount) : null,
      checkNumber: assistCheckNumber || null,
      notes: assistNotes || null,
      items,
    }

    setAssistanceDrafts((prev) => [...prev, draft])
    setShowAssistModal(false)
  }

  const handleDeleteAssistanceDraft = (draftId: string) => {
    setAssistanceDrafts((prev) => prev.filter((d) => d.id !== draftId))
  }

  const openCreateClientModal = (mode: 'applicant' | 'member') => {
    setClientModalMode(mode)
    resetNewClientForm()
    setShowCreateClientModal(true)
  }

  const openCreateHouseholdModal = () => {
    resetNewHouseholdForm()
    setShowCreateHouseholdModal(true)
  }

  const selectApplicantFromList = (client: ClientListItem) => {
    setApplicant(client)
    setHouseholdManuallySelected(false)
    setShowApplicantModal(false)
    setClientSearch('')
    setFormError(null)

    setHouseholdMembers((prev) => {
      const others = prev.filter((m) => !m.isApplicant && m.clientId !== client.id)
      const existingApplicant = prev.find((m) => m.isApplicant)

      return [
        {
          clientId: client.id,
          fullName: `${client.firstName} ${client.lastName}`.trim(),
          dob: client.dob ?? undefined,
          relationshipToApplicant: 'Self',
          incomeAmount: existingApplicant?.incomeAmount,
          incomeSource: existingApplicant?.incomeSource,
          isApplicant: true,
          firstName: client.firstName,
          lastName: client.lastName,
        },
        ...others,
      ]
    })
  }

  const selectHouseholdFromList = (item: HouseholdListItem) => {
    setHousehold(item)
    setHouseholdManuallySelected(true)
    setShowHouseholdModal(false)
    setHouseholdSearch('')
  }

  const addMemberFromClient = (client: ClientListItem) => {
    setHouseholdMembers((prev) => {
      if (prev.some((m) => m.clientId === client.id)) return prev

      const fullName = `${client.firstName} ${client.lastName}`.trim()
      return [
        ...prev,
        {
          clientId: client.id,
          fullName,
          dob: client.dob ?? undefined,
          relationshipToApplicant: '',
          incomeAmount: undefined,
          incomeSource: '',
          isApplicant: false,
          firstName: client.firstName,
          lastName: client.lastName,
        },
      ]
    })
    setShowMemberModal(false)
    setClientSearch('')
  }

  const handleCreateClient = (e: FormEvent) => {
    e.preventDefault()

    const payload = {
      householdId: household?.id ?? null,
      firstName: newClientFirstName.trim(),
      lastName: newClientLastName.trim(),
      dob: newClientDob || null,
      phone: newClientPhone || null,
    }

    createClient.mutate(payload, {
      onSuccess: (newId) => {
        const client: ClientListItem = {
          id: newId,
          firstName: payload.firstName,
          lastName: payload.lastName,
          dob: payload.dob ?? undefined,
          phone: payload.phone ?? undefined,
          street1: undefined,
          city: undefined,
          state: undefined,
          zip: undefined,
        }

        if (clientModalMode === 'applicant') {
          selectApplicantFromList(client)
        } else {
          addMemberFromClient(client)
        }

        setShowCreateClientModal(false)
        setClientModalMode(null)
        resetNewClientForm()
      },
    })
  }

  const handleCreateHousehold = (e: FormEvent) => {
    e.preventDefault()

    const payload = {
      street1: newHouseholdStreet1.trim(),
      street2: newHouseholdStreet2 || null,
      city: newHouseholdCity.trim(),
      state: newHouseholdState.trim() || 'TN',
      zip: newHouseholdZip || null,
    }

    createHousehold.mutate(payload, {
      onSuccess: (newId) => {
        const item: HouseholdListItem = {
          id: newId,
          street1: payload.street1,
          street2: payload.street2 ?? undefined,
          city: payload.city,
          state: payload.state,
          zip: payload.zip ?? undefined,
          memberCount: householdMembers.length,
          lastActivityAt: null,
        }

        selectHouseholdFromList(item)
        resetNewHouseholdForm()
        setShowCreateHouseholdModal(false)
      },
    })
  }

  const normalizedMembers = useMemo(() => {
    const trimmed = householdMembers
      .map((m) => ({ ...m, fullName: m.fullName.trim() }))
      .filter((m) => m.fullName)

    if (applicant) {
      const fullName = `${applicant.firstName} ${applicant.lastName}`.trim()
      const existingIdx = trimmed.findIndex((m) => m.isApplicant || m.clientId === applicant.id)

      const applicantEntry =
        existingIdx >= 0
          ? {
              ...trimmed[existingIdx],
              clientId: applicant.id,
              fullName,
              isApplicant: true,
              relationshipToApplicant: trimmed[existingIdx].relationshipToApplicant || 'Self',
            }
          : {
              clientId: applicant.id,
              fullName,
              dob: '',
              relationshipToApplicant: 'Self',
              incomeAmount: undefined,
              incomeSource: '',
              isApplicant: true,
            }

      const others = trimmed.filter((_, i) => i !== existingIdx)
      return [applicantEntry, ...others]
    }

    return trimmed
  }, [householdMembers, applicant])

  const normalizedBills = useMemo(
    () =>
      billRequests
        .map((b) => ({ ...b, billType: b.billType.trim() }))
        .filter((b) => b.billType && (Number(b.amountRequested) > 0 || (b.accountNumber ?? '').trim())),
    [billRequests],
  )

  const totalHouseholdIncome = useMemo(() => {
    const sum = normalizedMembers.reduce((total, member) => {
      return total + (member.incomeAmount != null ? Number(member.incomeAmount) : 0)
    }, 0)
    return sum > 0 ? sum : null
  }, [normalizedMembers])

  const totalHouseholdCount = normalizedMembers.length
  const isHelpingHands = programType === 'HelpingHands' || programType === 'Both'
  const isFoodPantry = programType === 'FoodPantry' || programType === 'Both'

  const getBill = (type: string): ApplicationBillRequestInput => {
    return billRequests.find((b) => b.billType === type) ?? { billType: type, amountRequested: 0, accountNumber: '' }
  }

  const upsertBill = (type: string, patch: Partial<ApplicationBillRequestInput>) => {
    setBillRequests((prev) => {
      const idx = prev.findIndex((b) => b.billType === type)
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = { ...next[idx], ...patch, billType: type }
        return next
      }
      return [...prev, { billType: type, amountRequested: 0, accountNumber: '', ...patch }]
    })
  }

  const rentAmount = getBill('Rent').amountRequested ?? 0
  const seekingRentalAssistance = rentAmount > 0

  const showFoodStampsDetails = receivesFoodStamps === 'yes'
  const showUtilityAssistanceFrom = receivedUtility === 'yes'

  const incomeSourcesSummary = useMemo(() => {
    const set = new Set(
      normalizedMembers
        .map((m) => (m.incomeSource ?? '').trim())
        .filter(Boolean),
    )
    return Array.from(set)
  }, [normalizedMembers])

  const householdClientOptions = useMemo(() => {
    return householdMembers.map((m) => ({ id: m.clientId ?? '', name: m.fullName }))
  }, [householdMembers])

  const assistanceDraftsByProgram = useMemo(() => {
    return {
      HelpingHands: assistanceDrafts.filter((a) => a.programType === 'HelpingHands'),
      FoodPantry: assistanceDrafts.filter((a) => a.programType === 'FoodPantry'),
    }
  }, [assistanceDrafts])

  const submitAssistanceDrafts = async (applicationIds: Partial<Record<'HelpingHands' | 'FoodPantry', string>>) => {
    if (!household || assistanceDrafts.length === 0) return

    const applicantId = applicant?.id ?? null

    const payloads: AssistanceEventCreatePayload[] = assistanceDrafts
      .map((draft) => {
        const applicationId = applicationIds[draft.programType as 'HelpingHands' | 'FoodPantry']
        if (!applicationId) return null

        return {
          programType: draft.programType,
          occurredAt: draft.occurredAt ? new Date(draft.occurredAt).toISOString() : new Date().toISOString(),
          householdId: household.id,
          householdMemberCount: normalizedMembers.length,
          clientId: draft.clientId || applicantId,
          applicationId,
          billType: draft.billType || null,
          amountPaid: draft.amountPaid != null ? Number(draft.amountPaid) : null,
          checkNumber: draft.checkNumber || null,
          notes: draft.notes || null,
          items: draft.items,
        }
      })
      .filter((p): p is AssistanceEventCreatePayload => Boolean(p))

    if (!payloads.length) return

    await Promise.all(payloads.map((p) => apiPost<string>('/assistance-events', p)))
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    if (!applicant || !household) {
      setFormError('Select an applicant and household before saving.')
      return
    }

    setFormError(null)
    setIsSubmitting(true)

    const sharedMembers = normalizedMembers.map((m) => ({
      clientId: m.clientId || null,
      fullName: m.fullName,
      dob: m.dob || null,
      relationshipToApplicant: m.relationshipToApplicant || null,
      incomeAmount: m.incomeAmount != null ? Number(m.incomeAmount) : null,
      incomeSource: m.incomeSource || null,
    }))

    const sharedBills = normalizedBills.map((b) => ({
      billType: b.billType || 'Rent',
      amountRequested: Number(b.amountRequested ?? 0),
      accountNumber: b.accountNumber || null,
    }))

    const foodStampsFlag = receivesFoodStamps === 'yes' ? true : receivesFoodStamps === 'no' ? false : null
    const foodStampsAmountValue = foodStampsAmount ? Number(foodStampsAmount) : null
    const foodStampsDateValue = foodStampsDateAvailable || null

    const commonIncome = totalHouseholdIncome
    const baseBothPayload: ApplicationBothCreatePayload = {
      applicantClientId: applicant.id,
      householdId: household.id,
      emergencySummary,
      totalHouseholdMonthlyIncome: commonIncome,
      receivedUtilityAssistancePastYear:
        receivedUtility === 'yes' ? true : receivedUtility === 'no' ? false : null,
      utilityAssistanceFrom: utilityAssistanceFrom || null,
      preventionPlan: preventionPlan || null,
      receivesFoodStamps: foodStampsFlag,
      foodStampsAmount: foodStampsAmountValue,
      foodStampsDateAvailable: foodStampsDateValue,
      landlordName: landlordName || null,
      landlordPhone: landlordPhone || null,
      landlordAddress: landlordAddress || null,
      verifiedByUserId: verifiedByUserId || null,
      householdMembers: sharedMembers,
      billRequests: sharedBills,
    }

    try {
      if (programType === 'Both') {
        const resp = await createBoth.mutateAsync(baseBothPayload)
        await submitAssistanceDrafts({ HelpingHands: resp.helpingHandsApplicationId, FoodPantry: resp.foodPantryApplicationId })
        navigate(`/applications/${resp.helpingHandsApplicationId}`)
        return
      }

      const payloadBase = {
        status: decisionStatus,
        submittedAt: submittedAt ? new Date(submittedAt).toISOString() : null,
        householdId: household.id,
        emergencySummary,
        totalHouseholdMonthlyIncome: commonIncome,
        receivedUtilityAssistancePastYear: baseBothPayload.receivedUtilityAssistancePastYear,
        utilityAssistanceFrom: baseBothPayload.utilityAssistanceFrom,
        preventionPlan: baseBothPayload.preventionPlan,
        receivesFoodStamps: baseBothPayload.receivesFoodStamps,
        foodStampsAmount: baseBothPayload.foodStampsAmount,
        foodStampsDateAvailable: baseBothPayload.foodStampsDateAvailable,
        landlordName: baseBothPayload.landlordName,
        landlordPhone: baseBothPayload.landlordPhone,
        landlordAddress: baseBothPayload.landlordAddress,
        verifiedByUserId: baseBothPayload.verifiedByUserId,
        decision: decisionStatus,
        decisionDate: decisionDate || null,
        boardNotes: boardNotes || null,
        householdMembers: sharedMembers,
        billRequests: sharedBills,
      }

      if (isEdit && id) {
        await update.mutateAsync({ id, payload: payloadBase })
        await submitAssistanceDrafts({ [programType]: id })
        navigate(`/applications/${id}`)
      } else {
        const payload = {
          ...payloadBase,
          programType,
          applicantClientId: applicant.id,
        }
        const newId = await create.mutateAsync(payload)
        await submitAssistanceDrafts({ [programType]: newId })
        navigate(`/applications/${newId}`)
      }
    } catch (err) {
      console.error(err)
      setFormError('Unable to save application. Please review fields and try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isEdit && isLoading) {
    return (
      <Container className="py-3">
        <Spinner animation="border" size="sm" />
      </Container>
    )
  }

  if (isEdit && error) {
    return (
      <Container className="py-3">
        <Alert variant="danger">Unable to load application.</Alert>
      </Container>
    )
  }

  const saving = isSubmitting || create.isPending || createBoth.isPending || update.isPending
  const submitError = create.error || createBoth.error || update.error

  return (
    <Container className="py-3" style={{ maxWidth: 1100 }}>
      <h1 className="h4 mb-3">{isEdit ? 'Edit Application' : 'New Application'}</h1>

      {submitError ? <Alert variant="danger">Unable to save. Please check the required fields.</Alert> : null}
      {formError ? <Alert variant="warning">{formError}</Alert> : null}

      <Form onSubmit={handleSubmit} className="bg-white p-3 border rounded">
        <Stack gap={3}>
          {/* Program (still needed), but it's not part of the paper form, so keep it small & first */}
          <Row className="g-3">
            <Col md={4}>
              <Form.Group controlId="programType">
                <Form.Label>Program</Form.Label>
                <Form.Select
                  value={programType}
                  onChange={(e) => setProgramType(e.target.value as ProgramType)}
                  disabled={isEdit}
                >
                  <option value="FoodPantry">Food Pantry</option>
                  <option value="HelpingHands">Helping Hands</option>
                  <option value="Both">Both</option>
                </Form.Select>
                {isEdit ? <Form.Text className="text-muted">Program cannot be changed after submission.</Form.Text> : null}
              </Form.Group>
            </Col>
          </Row>

          {/* PAPER HEADER BLOCK */}
          <Card>
            <Card.Body>
              <Card.Title className="h6 mb-3">
                {programType === 'FoodPantry'
                  ? 'Food Pantry Application'
                  : programType === 'HelpingHands'
                    ? 'Helping Hands Application'
                    : 'Food Pantry + Helping Hands (Both)'}
              </Card.Title>

              {/* Mimic the "Must be completed..." / "Complete front and back..." callouts */}
              {/* Instructional callouts removed per request */}

              <Row className="g-3">
                <Col md={4}>
                  <Form.Group controlId="submittedAt">
                    <Form.Label>DATE</Form.Label>
                    <Form.Control
                      type="datetime-local"
                      value={submittedAt}
                      onChange={(e) => setSubmittedAt(e.target.value)}
                    />
                  </Form.Group>
                </Col>

                <Col md={4}>
                  <Form.Group>
                    <Form.Label>NAME</Form.Label>
                    <Form.Control
                      value={applicant ? `${applicant.firstName} ${applicant.lastName}`.trim() : ''}
                      placeholder="Select an applicant"
                      readOnly
                    />
                  </Form.Group>
                </Col>

                <Col md={4}>
                  <Form.Group>
                    <Form.Label>PHONE</Form.Label>
                    <Form.Control
                      value={applicant?.phone ?? ''}
                      placeholder="(from applicant record)"
                      readOnly
                    />
                  </Form.Group>
                </Col>

                <Col md={6}>
                  <Form.Group>
                    <Form.Label>ADDRESS</Form.Label>
                    <Form.Control value={household?.street1 ?? ''} placeholder="Select a household" readOnly />
                  </Form.Group>
                </Col>

                <Col md={3}>
                  <Form.Group>
                    <Form.Label>CITY</Form.Label>
                    <Form.Control value={household?.city ?? ''} readOnly />
                  </Form.Group>
                </Col>

                <Col md={3}>
                  <Form.Group>
                    <Form.Label>ZIP</Form.Label>
                    <Form.Control value={household?.zip ?? ''} readOnly />
                  </Form.Group>
                </Col>
              </Row>

              {/* Keep your select buttons, but tuck them under the "paper header" */}
              <Stack direction="horizontal" gap={2} className="mt-3 flex-wrap">
                <Button
                  size="sm"
                  variant="primary"
                  type="button"
                  onClick={() => {
                    setClientSearch('')
                    setShowApplicantModal(true)
                  }}
                  disabled={isEdit}
                >
                  {applicant ? 'Change applicant' : 'Select applicant'}
                </Button>

                <Button
                  size="sm"
                  variant="primary"
                  type="button"
                  onClick={() => {
                    setHouseholdSearch('')
                    setShowHouseholdModal(true)
                  }}
                >
                  {household ? 'Change household' : 'Select household'}
                </Button>
              </Stack>

              {!applicant || !household ? (
                <div className="text-muted small mt-2">
                  Select an applicant and a household to continue.
                </div>
              ) : null}
            </Card.Body>
          </Card>

          {/* FOOD PANTRY SECTION */}
          {isFoodPantry ? (
            <Card>
              <Card.Body>
                <Card.Title className="h6 mb-3">Food Pantry</Card.Title>

                <Row className="g-3">
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Total persons living in household</Form.Label>
                      <Form.Control value={String(totalHouseholdCount)} readOnly />
                    </Form.Group>
                  </Col>

                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Total household monthly income</Form.Label>
                      <Form.Control
                        value={totalHouseholdIncome != null ? `$${totalHouseholdIncome.toLocaleString()}` : ''}
                        placeholder="(computed from household members below)"
                        readOnly
                      />
                    </Form.Group>
                  </Col>

                  <Col md={12}>
                    <Form.Text className="text-muted">
                      Source (paper form examples): Work, SSI, Child support, SS Disability, Other.
                      {incomeSourcesSummary.length
                        ? ` From member entries: ${incomeSourcesSummary.join(', ')}`
                        : ''}
                    </Form.Text>
                  </Col>
                </Row>

                <hr />

                <Row className="g-3 align-items-end">
                  <Col md={4}>
                    <Form.Group controlId="receivesFoodStamps">
                      <Form.Label>Do you receive food stamps?</Form.Label>
                      <div>
                        <Form.Check
                          inline
                          type="radio"
                          id="foodStampsYes"
                          label="Yes"
                          name="foodStamps"
                          checked={receivesFoodStamps === 'yes'}
                          onChange={() => setReceivesFoodStamps('yes')}
                        />
                        <Form.Check
                          inline
                          type="radio"
                          id="foodStampsNo"
                          label="No"
                          name="foodStamps"
                          checked={receivesFoodStamps === 'no'}
                          onChange={() => setReceivesFoodStamps('no')}
                        />
                      </div>
                    </Form.Group>
                  </Col>

                  {showFoodStampsDetails ? (
                    <>
                      <Col md={4}>
                        <Form.Group controlId="foodStampsAmount">
                          <Form.Label>Amount</Form.Label>
                          <Form.Control
                            type="number"
                            min={0}
                            step="0.01"
                            value={foodStampsAmount}
                            onChange={(e) => setFoodStampsAmount(e.target.value)}
                            placeholder="Monthly benefit"
                          />
                        </Form.Group>
                      </Col>

                      <Col md={4}>
                        <Form.Group controlId="foodStampsDateAvailable">
                          <Form.Label>Date available</Form.Label>
                          <Form.Control
                            type="date"
                            value={foodStampsDateAvailable}
                            onChange={(e) => setFoodStampsDateAvailable(e.target.value)}
                          />
                        </Form.Group>
                      </Col>
                    </>
                  ) : null}
                </Row>
              </Card.Body>
            </Card>
          ) : null}

          {/* HELPING HANDS SECTION */}
          {isHelpingHands ? (
            <Card>
              <Card.Body>
                <Card.Title className="h6 mb-3">Helping Hands</Card.Title>

                <Alert variant="light" className="py-2">
                  The bill being considered <strong>MUST</strong> be in applicant's name.
                </Alert>

                <div className="fw-semibold mb-2">
                  ENTER THE AMOUNT YOU ARE REQUESTING IN THE APPROPRIATE SPACE PROVIDED
                </div>

                {/* Fixed "paper-style" bill fields */}
                <Row className="g-3">
                  <Col md={3}>
                    <Form.Group>
                      <Form.Label>RENT $</Form.Label>
                      <Form.Control
                        type="number"
                        min={0}
                        value={getBill('Rent').amountRequested ?? 0}
                        onChange={(e) => upsertBill('Rent', { amountRequested: e.target.value ? Number(e.target.value) : 0 })}
                      />
                    </Form.Group>
                  </Col>

                  <Col md={3}>
                    <Form.Group>
                      <Form.Label>ELECTRIC $</Form.Label>
                      <Form.Control
                        type="number"
                        min={0}
                        value={getBill('Electric').amountRequested ?? 0}
                        onChange={(e) =>
                          upsertBill('Electric', { amountRequested: e.target.value ? Number(e.target.value) : 0 })
                        }
                      />
                    </Form.Group>
                  </Col>

                  <Col md={3}>
                    <Form.Group>
                      <Form.Label>Acc. #</Form.Label>
                      <Form.Control
                        value={getBill('Electric').accountNumber ?? ''}
                        onChange={(e) => upsertBill('Electric', { accountNumber: e.target.value })}
                      />
                    </Form.Group>
                  </Col>

                  <Col md={3}>
                    <Form.Group>
                      <Form.Label>NATURAL GAS $</Form.Label>
                      <Form.Control
                        type="number"
                        min={0}
                        value={getBill('NaturalGas').amountRequested ?? 0}
                        onChange={(e) =>
                          upsertBill('NaturalGas', { amountRequested: e.target.value ? Number(e.target.value) : 0 })
                        }
                      />
                    </Form.Group>
                  </Col>

                  <Col md={3}>
                    <Form.Group>
                      <Form.Label>WATER $</Form.Label>
                      <Form.Control
                        type="number"
                        min={0}
                        value={getBill('Water').amountRequested ?? 0}
                        onChange={(e) => upsertBill('Water', { amountRequested: e.target.value ? Number(e.target.value) : 0 })}
                      />
                    </Form.Group>
                  </Col>
                </Row>

                {/* Landlord fields only if seeking rental assistance */}
                {seekingRentalAssistance ? (
                  <>
                    <hr />
                    <div className="fw-semibold mb-2">IF SEEKING RENTAL ASSISTANCE</div>
                    <Row className="g-3">
                      <Col md={4}>
                        <Form.Group controlId="landlordName">
                          <Form.Label>LANDLORD'S NAME</Form.Label>
                          <Form.Control value={landlordName} onChange={(e) => setLandlordName(e.target.value)} />
                        </Form.Group>
                      </Col>
                      <Col md={4}>
                        <Form.Group controlId="landlordPhone">
                            <Form.Label>PHONE</Form.Label>
                            <PhoneInput value={landlordPhone} onChange={setLandlordPhone} />
                          </Form.Group>
                      </Col>
                      <Col md={4}>
                        <Form.Group controlId="landlordAddress">
                          <Form.Label>ADDRESS</Form.Label>
                          <Form.Control value={landlordAddress} onChange={(e) => setLandlordAddress(e.target.value)} />
                        </Form.Group>
                      </Col>
                    </Row>
                  </>
                ) : (
                  <Form.Text className="text-muted d-block mt-2">
                    Landlord fields appear when requesting a Rent amount.
                  </Form.Text>
                )}

                <hr />

                <Row className="g-3 align-items-end">
                  <Col md={6}>
                    <Form.Group controlId="receivedUtility">
                      <Form.Label>HAVE YOU RECEIVED ANY KIND OF UTILITY ASSISTANCE IN THE PAST YEAR?</Form.Label>
                      <div>
                        <Form.Check
                          inline
                          type="radio"
                          id="receivedUtilityYes"
                          label="Yes"
                          name="receivedUtility"
                          checked={receivedUtility === 'yes'}
                          onChange={() => setReceivedUtility('yes')}
                        />
                        <Form.Check
                          inline
                          type="radio"
                          id="receivedUtilityNo"
                          label="No"
                          name="receivedUtility"
                          checked={receivedUtility === 'no'}
                          onChange={() => setReceivedUtility('no')}
                        />
                      </div>
                    </Form.Group>
                  </Col>

                  {showUtilityAssistanceFrom ? (
                    <Col md={6}>
                      <Form.Group controlId="utilityFrom">
                        <Form.Label>If so, from whom?</Form.Label>
                        <Form.Control
                          value={utilityAssistanceFrom}
                          onChange={(e) => setUtilityAssistanceFrom(e.target.value)}
                        />
                      </Form.Group>
                    </Col>
                  ) : null}
                </Row>
              </Card.Body>
            </Card>
          ) : null}

          {/* HOUSEHOLD TABLE (paper-style lines) */}
          <Card>
            <Card.Body>
              <Card.Title className="h6 mb-2">
                {isHelpingHands && !isFoodPantry
                  ? 'LIST ALL PERSONS IN THE HOUSEHOLD - AND THEIR D/O/B AND INCOMES'
                  : 'Please List All Persons in Household'}
              </Card.Title>

              <Table responsive striped className="mb-2">
                <thead>
                  <tr>
                    <th style={{ width: '26%' }}>Name</th>
                    <th style={{ width: '16%' }}>DOB</th>
                    <th style={{ width: '18%' }}>Relationship</th>
                    <th style={{ width: '16%' }}>Income</th>
                    {(isHelpingHands || programType === 'Both') ? <th style={{ width: '18%' }}>Source</th> : null}
                    <th style={{ width: '6%' }} />
                  </tr>
                </thead>
                <tbody>
                  {householdMembers.map((member, idx) => {
                    const isApplicantMember = Boolean(member.isApplicant || (applicant && member.clientId === applicant.id))

                    return (
                      <tr key={idx}>
                        <td>
                          <div className="fw-semibold d-flex align-items-center gap-2">
                            {member.fullName}
                            {isApplicantMember ? <Badge bg="light" text="dark">Applicant</Badge> : null}
                          </div>
                        </td>

                        <td>
                          <Form.Control
                            type="date"
                            value={(member.dob as string) ?? ''}
                            onChange={(e) => {
                              const next = [...householdMembers]
                              next[idx] = { ...member, dob: e.target.value }
                              setHouseholdMembers(next)
                            }}
                          />
                        </td>

                        <td>
                          <Form.Control
                            value={member.relationshipToApplicant ?? ''}
                            onChange={(e) => {
                              const next = [...householdMembers]
                              next[idx] = { ...member, relationshipToApplicant: e.target.value }
                              setHouseholdMembers(next)
                            }}
                            placeholder={isApplicantMember ? 'Self' : 'e.g., Spouse'}
                          />
                        </td>

                        <td>
                          <Form.Control
                            type="number"
                            min={0}
                            value={member.incomeAmount ?? ''}
                            onChange={(e) => {
                              const next = [...householdMembers]
                              const val = e.target.value
                              next[idx] = { ...member, incomeAmount: val ? Number(val) : undefined }
                              setHouseholdMembers(next)
                            }}
                          />
                        </td>

                        {(isHelpingHands || programType === 'Both') ? (
                          <td>
                            <Form.Control
                              value={member.incomeSource ?? ''}
                              onChange={(e) => {
                                const next = [...householdMembers]
                                next[idx] = { ...member, incomeSource: e.target.value }
                                setHouseholdMembers(next)
                              }}
                              placeholder="Employment / SSI / etc."
                            />
                          </td>
                        ) : null}

                        <td className="text-end">
                          <Button
                            variant="outline-secondary"
                            size="sm"
                            type="button"
                            onClick={() => setHouseholdMembers(householdMembers.filter((_, i) => i !== idx))}
                            disabled={isApplicantMember}
                          >
                            Remove
                          </Button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </Table>

              <div className="text-muted small">
                Total persons: {totalHouseholdCount}
                {totalHouseholdIncome != null ? ` · Total household monthly income: $${totalHouseholdIncome.toLocaleString()}` : ''}
              </div>

              <Stack direction="horizontal" gap={2} className="flex-wrap mt-2">
                <Button
                  variant="outline-primary"
                  size="sm"
                  type="button"
                  onClick={() => {
                    setClientSearch('')
                    setShowMemberModal(true)
                  }}
                >
                  Add from clients
                </Button>
                <Button
                  variant="outline-secondary"
                  size="sm"
                  type="button"
                  onClick={() => openCreateClientModal('member')}
                >
                  Add new client
                </Button>
              </Stack>
            </Card.Body>
          </Card>

          {/* EMERGENCY / BACK-OF-FORM SECTION */}
          <Card>
            <Card.Body>
              <Card.Title className="h6 mb-2">
                {isHelpingHands
                    ? 'Please provide a detailed summary of your EMERGENCY SITUATION'
                  : 'Food Boxes are for EMERGENCY NEEDS'}
              </Card.Title>

              <Form.Group controlId="emergencySummary">
                <Form.Label>
                  {isHelpingHands
                    ? "Emergency situation (what happened / what's urgent)"
                    : 'Please explain your situation/emergency'}
                </Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={emergencySummary}
                  onChange={(e) => setEmergencySummary(e.target.value)}
                  required
                />
              </Form.Group>

              {isHelpingHands ? (
                <Form.Group controlId="preventionPlan" className="mt-3">
                  <Form.Label>How are you taking steps to avoid this situation in the future?</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    value={preventionPlan}
                    onChange={(e) => setPreventionPlan(e.target.value)}
                  />
                </Form.Group>
              ) : null}
            </Card.Body>
          </Card>

          {/* FOR OFFICE ONLY */}
          <Stack gap={3}>
            {isHelpingHands ? (
              <Card>
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
                    <Card.Title className="h6 mb-0">Helping Hands - For Office Use Only</Card.Title>
                    <Button size="sm" variant="outline-primary" type="button" onClick={() => openAssistModal('HelpingHands')}>
                      Add assistance
                    </Button>
                  </div>

                  <Row className="g-3">
                    <Col md={4}>
                      <Form.Group controlId="decisionStatus">
                        <Form.Label>Decision / Status</Form.Label>
                        <Form.Select value={decisionStatus} onChange={(e) => setDecisionStatus(e.target.value)}>
                          <option value="Pending">Pending</option>
                          <option value="Submitted">Submitted</option>
                          <option value="InReview">In review</option>
                          <option value="Approved">Approved</option>
                          <option value="Denied">Denied</option>
                          <option value="Withdrawn">Withdrawn</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>

                    <Col md={4}>
                      <Form.Group controlId="decisionDate">
                        <Form.Label>Date</Form.Label>
                        <Form.Control
                          type="date"
                          value={decisionDate ?? ''}
                          onChange={(e) => setDecisionDate(e.target.value)}
                        />
                      </Form.Group>
                    </Col>

                    <Col md={4}>
                      <Form.Group controlId="verifiedBy">
                        <Form.Label>Client Notified By</Form.Label>
                        <br/>
                        {verifiedByUserId ? (
                          <div className="border rounded p-2 d-flex justify-content-between align-items-start gap-2">
                            <div>
                              <div className="fw-semibold">{verifierDetails.data?.displayName ?? 'Selected user'}</div>
                              <div className="text-muted small">{verifierDetails.data?.email ?? verifiedByUserId}</div>
                            </div>
                            <Stack direction="horizontal" gap={2} className="flex-wrap">
                              <Button
                                variant="outline-primary"
                                size="sm"
                                type="button"
                                onClick={() => {
                                  setVerifierSearch('')
                                  setShowVerifierModal(true)
                                }}
                              >
                                Change
                              </Button>
                              <Button
                                variant="outline-secondary"
                                size="sm"
                                type="button"
                                onClick={() => setVerifiedByUserId('')}
                              >
                                Clear
                              </Button>
                            </Stack>
                          </div>
                        ) : (
                          <Button
                            variant="outline-primary"
                            size="sm"
                            type="button"
                            onClick={() => {
                              setVerifierSearch('')
                              setShowVerifierModal(true)
                            }}
                          >
                            Assign notifier
                          </Button>
                        )}
                      </Form.Group>
                    </Col>

                    <Col md={12}>
                      <Form.Group controlId="boardNotes">
                        <Form.Label>Board Notes / History</Form.Label>
                        <Form.Control
                          as="textarea"
                          rows={2}
                          value={boardNotes}
                          onChange={(e) => setBoardNotes(e.target.value)}
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  {assistanceDraftsByProgram.HelpingHands.length ? (
                    <Table bordered striped size="sm" responsive className="mt-3">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Bill / Notes</th>
                          <th>Amount Paid</th>
                          <th>Check #</th>
                          <th />
                        </tr>
                      </thead>
                      <tbody>
                        {assistanceDraftsByProgram.HelpingHands.map((draft) => (
                          <tr key={draft.id}>
                            <td>{draft.occurredAt ? new Date(draft.occurredAt).toLocaleDateString() : '—'}</td>
                            <td>
                              {draft.billType || '—'}
                              {draft.notes ? <div className="text-muted small">{draft.notes}</div> : null}
                            </td>
                            <td>{draft.amountPaid != null ? `$${draft.amountPaid.toLocaleString()}` : '—'}</td>
                            <td>{draft.checkNumber || '—'}</td>
                            <td className="text-end">
                              <Button variant="outline-secondary" size="sm" type="button" onClick={() => handleDeleteAssistanceDraft(draft.id)}>
                                Delete
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  ) : (
                    <Form.Text className="text-muted d-block mt-2">No assistance added yet.</Form.Text>
                  )}
                </Card.Body>
              </Card>
            ) : null}

            {isFoodPantry ? (
              <Card>
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
                    <Card.Title className="h6 mb-0">Food Pantry - For Office Use Only</Card.Title>
                    <Button size="sm" variant="outline-primary" type="button" onClick={() => openAssistModal('FoodPantry')}>
                      Add assistance
                    </Button>
                  </div>

                  <Row className="g-3">
                    <Col md={6}>
                      <Form.Group controlId="verifiedByFood">
                                              <Form.Label>Client Log Verified by</Form.Label>
                                              <br/>
                        {verifiedByUserId ? (
                          <div className="border rounded p-2 d-flex justify-content-between align-items-start gap-2">
                            <div>
                              <div className="fw-semibold">{verifierDetails.data?.displayName ?? 'Selected user'}</div>
                              <div className="text-muted small">{verifierDetails.data?.email ?? verifiedByUserId}</div>
                            </div>
                            <Stack direction="horizontal" gap={2} className="flex-wrap">
                              <Button
                                variant="outline-primary"
                                size="sm"
                                type="button"
                                onClick={() => {
                                  setVerifierSearch('')
                                  setShowVerifierModal(true)
                                }}
                              >
                                Change
                              </Button>
                              <Button
                                variant="outline-secondary"
                                size="sm"
                                type="button"
                                onClick={() => setVerifiedByUserId('')}
                              >
                                Clear
                              </Button>
                            </Stack>
                          </div>
                        ) : (
                          <Button
                            variant="outline-primary"
                            size="sm"
                            type="button"
                            onClick={() => {
                              setVerifierSearch('')
                              setShowVerifierModal(true)
                            }}
                          >
                            Assign verifier
                          </Button>
                        )}
                      </Form.Group>
                    </Col>

                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>Client received a box last</Form.Label>
                        <Form.Control
                          value={assistanceDraftsByProgram.FoodPantry.length
                            ? new Date(
                                assistanceDraftsByProgram.FoodPantry[assistanceDraftsByProgram.FoodPantry.length - 1].occurredAt,
                              ).toLocaleDateString()
                            : 'Not recorded yet'}
                          readOnly
                        />
                        <Form.Text className="text-muted">Will update when assistance is added and saved.</Form.Text>
                      </Form.Group>
                    </Col>
                  </Row>

                  {assistanceDraftsByProgram.FoodPantry.length ? (
                    <Table bordered striped size="sm" responsive className="mt-3">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Items Dispensed</th>
                          <th>Notes</th>
                          <th />
                        </tr>
                      </thead>
                      <tbody>
                        {assistanceDraftsByProgram.FoodPantry.map((draft) => (
                          <tr key={draft.id}>
                            <td>{draft.occurredAt ? new Date(draft.occurredAt).toLocaleDateString() : '—'}</td>
                            <td>
                              {draft.items.length
                                ? draft.items.map((i) => i.itemType).join(', ')
                                : 'Food box'}
                            </td>
                            <td>{draft.notes || '—'}</td>
                            <td className="text-end">
                              <Button variant="outline-secondary" size="sm" type="button" onClick={() => handleDeleteAssistanceDraft(draft.id)}>
                                Delete
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  ) : (
                    <Form.Text className="text-muted d-block mt-2">No assistance added yet.</Form.Text>
                  )}
                </Card.Body>
              </Card>
            ) : null}
          </Stack>

          <Stack direction="horizontal" gap={2}>
            <Button type="submit" disabled={saving || !applicant || !household}>
              {saving ? 'Saving...' : isEdit ? 'Update Application' : 'Create Application'}
            </Button>
            <Button
              variant="outline-secondary"
              type="button"
              onClick={() => navigate(isEdit && id ? `/applications/${id}` : '/applications')}
            >
              Cancel
            </Button>
          </Stack>
        </Stack>
      </Form>

      <ApplicantSelectModal
        show={showApplicantModal}
        search={clientSearch}
        onSearchChange={setClientSearch}
        onHide={() => setShowApplicantModal(false)}
        results={clientSearchQuery.data?.items ?? []}
        isLoading={clientSearchQuery.isFetching}
        onSelect={selectApplicantFromList}
        onCreateNew={() => openCreateClientModal('applicant')}
        onClear={() => setClientSearch('')}
      />

      <HouseholdSelectModal
        show={showHouseholdModal}
        search={householdSearch}
        onSearchChange={setHouseholdSearch}
        onHide={() => setShowHouseholdModal(false)}
        results={householdSearchQuery.data?.items ?? []}
        isLoading={householdSearchQuery.isFetching}
        onSelect={selectHouseholdFromList}
        onCreateNew={openCreateHouseholdModal}
        onClear={() => setHouseholdSearch('')}
      />

      <MemberSelectModal
        show={showMemberModal}
        search={clientSearch}
        onSearchChange={setClientSearch}
        onHide={() => setShowMemberModal(false)}
        results={clientSearchQuery.data?.items ?? []}
        isLoading={clientSearchQuery.isFetching}
        onSelect={addMemberFromClient}
        onCreateNew={() => openCreateClientModal('member')}
        onClear={() => setClientSearch('')}
      />

      <CreateClientModal
        show={showCreateClientModal}
        firstName={newClientFirstName}
        lastName={newClientLastName}
        dob={newClientDob}
        phone={newClientPhone}
        onFirstNameChange={setNewClientFirstName}
        onLastNameChange={setNewClientLastName}
        onDobChange={setNewClientDob}
        onPhoneChange={setNewClientPhone}
        onHide={() => {
          setShowCreateClientModal(false)
          setClientModalMode(null)
        }}
        onSubmit={handleCreateClient}
        saving={createClient.isPending}
        linkToHousehold={Boolean(household)}
      />

      <CreateHouseholdModal
        show={showCreateHouseholdModal}
        street1={newHouseholdStreet1}
        street2={newHouseholdStreet2}
        city={newHouseholdCity}
        state={newHouseholdState}
        zip={newHouseholdZip}
        onStreet1Change={setNewHouseholdStreet1}
        onStreet2Change={setNewHouseholdStreet2}
        onCityChange={setNewHouseholdCity}
        onStateChange={setNewHouseholdState}
        onZipChange={setNewHouseholdZip}
        onHide={() => setShowCreateHouseholdModal(false)}
        onSubmit={handleCreateHousehold}
        saving={createHousehold.isPending}
      />

      <UserSelectModal
        show={showVerifierModal}
        search={verifierSearch}
        onSearchChange={setVerifierSearch}
        onHide={() => setShowVerifierModal(false)}
        results={verifierSearchQuery.data?.items ?? []}
        isLoading={verifierSearchQuery.isFetching}
        onSelect={(user: UserListItem) => {
          setVerifiedByUserId(user.id)
          setShowVerifierModal(false)
          setVerifierSearch('')
        }}
        onClear={() => setVerifierSearch('')}
      />

      <Modal show={showAssistModal} onHide={() => setShowAssistModal(false)} centered>
        <Form onSubmit={handleAddAssistanceDraft}>
          <Modal.Header closeButton>
            <Modal.Title>Add assistance ({assistProgram === 'HelpingHands' ? 'Helping Hands' : 'Food Pantry'})</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Row className="g-3">
              <Col md={6}>
                <Form.Group controlId="assistDate">
                  <Form.Label>Date</Form.Label>
                  <Form.Control
                    type="datetime-local"
                    value={assistOccurredAt}
                    onChange={(e) => setAssistOccurredAt(e.target.value)}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group controlId="assistClient">
                  <Form.Label>Client</Form.Label>
                  <Form.Select
                    value={assistClientId ?? ''}
                    onChange={(e) => setAssistClientId(e.target.value || null)}
                  >
                    {householdClientOptions.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            {assistProgram === 'HelpingHands' ? (
              <>
                <Row className="g-3 mt-1">
                  <Col md={6}>
                    <Form.Group controlId="assistBillType">
                      <Form.Label>Bill Type</Form.Label>
                      <Form.Control
                        value={assistBillType}
                        onChange={(e) => setAssistBillType(e.target.value)}
                        placeholder="Rent / Electric / ..."
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group controlId="assistAmount">
                      <Form.Label>Amount Paid</Form.Label>
                      <Form.Control
                        type="number"
                        min={0}
                        value={assistAmount}
                        onChange={(e) => setAssistAmount(e.target.value)}
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Row className="g-3 mt-1">
                  <Col md={6}>
                    <Form.Group controlId="assistCheck">
                      <Form.Label>Check #</Form.Label>
                      <Form.Control value={assistCheckNumber} onChange={(e) => setAssistCheckNumber(e.target.value)} />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group controlId="assistNotes">
                      <Form.Label>Notes</Form.Label>
                      <Form.Control
                        value={assistNotes}
                        onChange={(e) => setAssistNotes(e.target.value)}
                        placeholder="Optional"
                      />
                    </Form.Group>
                  </Col>
                </Row>
              </>
            ) : (
              <>
                <div className="fw-semibold mt-3 mb-1">Check all dispensed</div>
                <Row className="g-2">
                  {[
                    { key: 'FoodBox', label: 'Food Box' },
                    { key: 'Eggs', label: 'Eggs' },
                    { key: 'Juice', label: 'Juice' },
                    { key: 'Milk', label: 'Milk' },
                    { key: 'Hygiene', label: 'Hygiene Items' },
                    { key: 'DiapersFormula', label: 'Diapers / Formula' },
                  ].map((item) => (
                    <Col xs={6} key={item.key}>
                      <Form.Check
                        type="checkbox"
                        id={`assist-item-${item.key}`}
                        label={item.label}
                        checked={Boolean(assistItems[item.key])}
                        onChange={(e) => setAssistItems((prev) => ({ ...prev, [item.key]: e.target.checked }))}
                      />
                    </Col>
                  ))}
                </Row>

                <Form.Group controlId="assistOther" className="mt-3">
                  <Form.Label>Other item</Form.Label>
                  <Form.Control
                    value={assistOtherItem}
                    onChange={(e) => setAssistOtherItem(e.target.value)}
                    placeholder="Optional"
                  />
                </Form.Group>

                <Form.Group controlId="assistNotesFood" className="mt-3">
                  <Form.Label>Notes</Form.Label>
                  <Form.Control
                    value={assistNotes}
                    onChange={(e) => setAssistNotes(e.target.value)}
                    placeholder="Optional"
                  />
                </Form.Group>
              </>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="outline-secondary" onClick={() => setShowAssistModal(false)}>
              Cancel
            </Button>
            <Button type="submit">Add</Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  )
}
