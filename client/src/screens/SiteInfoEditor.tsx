import { useMemo, useState } from 'react'
import Alert from 'react-bootstrap/Alert'
import Button from 'react-bootstrap/Button'
import Form from 'react-bootstrap/Form'
import Stack from 'react-bootstrap/Stack'
import { useSiteInfo, useSiteInfoMutations } from '../hooks/useSiteInfo'
import type { UpdateSiteInfoRequest } from '../types/siteInfo'
import RichTextMarkdownEditor from '../components/RichTextMarkdownEditor'

export function SiteInfoEditor() {
  const { data, isLoading, error } = useSiteInfo()
  const { update } = useSiteInfoMutations()

  const initial: UpdateSiteInfoRequest | null = useMemo(() => {
    if (!data) return null
    return {
      aboutText: data.aboutText ?? '',
      programsOverview: data.programsOverview ?? '',
      hoursText: data.hoursText ?? '',
      locationText: data.locationText ?? '',
      contactText: data.contactText ?? '',
      whatToBringText: data.whatToBringText ?? '',
    }
  }, [data])

  if (isLoading) return <div>Loading…</div>
  if (error) {
    return (
      <Alert variant="danger">
        Failed to load Site Info.
      </Alert>
    )
  }

  if (!data || !initial) {
    return (
      <Alert variant="danger">
        Site Info data is missing.
      </Alert>
    )
  }

  return (
    <SiteInfoEditorForm
      key={data.updatedAt}
      initial={initial}
      isSaving={update.isPending}
      isSaveError={update.isError}
      onSave={async (req) => update.mutateAsync(req)}
    />
  )
}

function SiteInfoEditorForm({
  initial,
  isSaving,
  isSaveError,
  onSave,
}: {
  initial: UpdateSiteInfoRequest
  isSaving: boolean
  isSaveError: boolean
  onSave: (req: UpdateSiteInfoRequest) => Promise<void>
}) {
  const [form, setForm] = useState<UpdateSiteInfoRequest>(initial)
  const [saved, setSaved] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaved(false)
    await onSave(form)
    setSaved(true)
  }

  return (
    <div style={{ maxWidth: 900 }}>
      <h1 className="h3 mb-3">Site Info</h1>

      {saved && <Alert variant="success">Saved.</Alert>}
      {isSaveError && <Alert variant="danger">Save failed.</Alert>}

      <Form onSubmit={onSubmit}>
        <Stack gap={3}>
          <Form.Group controlId="aboutText">
            <Form.Label>About / Mission</Form.Label>
            <RichTextMarkdownEditor
              value={form.aboutText ?? ''}
              onChange={(md) => setForm((f) => ({ ...f, aboutText: md }))}
              minHeight={160}
            />
          </Form.Group>

          <Form.Group controlId="programsOverview">
            <Form.Label>Programs Overview</Form.Label>
            <RichTextMarkdownEditor
              value={form.programsOverview ?? ''}
              onChange={(md) => setForm((f) => ({ ...f, programsOverview: md }))}
              minHeight={120}
            />
          </Form.Group>

          <Form.Group controlId="hoursText">
            <Form.Label>Hours</Form.Label>
            <RichTextMarkdownEditor
              value={form.hoursText ?? ''}
              onChange={(md) => setForm((f) => ({ ...f, hoursText: md }))}
              minHeight={80}
            />
          </Form.Group>

          <Form.Group controlId="locationText">
            <Form.Label>Location</Form.Label>
            <RichTextMarkdownEditor
              value={form.locationText ?? ''}
              onChange={(md) => setForm((f) => ({ ...f, locationText: md }))}
              minHeight={80}
            />
          </Form.Group>

          <Form.Group controlId="contactText">
            <Form.Label>Contact</Form.Label>
            <RichTextMarkdownEditor
              value={form.contactText ?? ''}
              onChange={(md) => setForm((f) => ({ ...f, contactText: md }))}
              minHeight={80}
            />
          </Form.Group>

          <Form.Group controlId="whatToBringText">
            <Form.Label>What To Bring</Form.Label>
            <RichTextMarkdownEditor
              value={form.whatToBringText ?? ''}
              onChange={(md) => setForm((f) => ({ ...f, whatToBringText: md }))}
              minHeight={120}
            />
          </Form.Group>

          <div>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? 'Saving…' : 'Save'}
            </Button>
          </div>
        </Stack>
      </Form>
    </div>
  )
}
