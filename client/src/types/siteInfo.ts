export type SiteInfo = {
  aboutText?: string | null
  programsOverview?: string | null
  hoursText?: string | null
  locationText?: string | null
  contactText?: string | null
  whatToBringText?: string | null
  updatedAt: string
}

export type UpdateSiteInfoRequest = {
  aboutText?: string | null
  programsOverview?: string | null
  hoursText?: string | null
  locationText?: string | null
  contactText?: string | null
  whatToBringText?: string | null
}
