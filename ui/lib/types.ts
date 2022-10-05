

export interface Response {
  status: string
  debug_msg?: string
}

export interface ListingResponse extends Response {
  limit: number
  offset: number
}

export interface IRef {
  id: string
  title: string
  site: string
  url: string
}

export interface IRefTag {
  ref: IRef
  key: string
  text: string
  category: string
  cluster?: string
  link_type?: string
  count: number
}

export interface ISite {
  site: string
  ref_count: number
}

export interface ISiteListingResponse extends ListingResponse {
  results: ISite[]
}

export interface ILink {
  source: string
  source_cluster: string
  target: string
  target_cluster: string
  type: string
  user?: string
  timestamp?: string
}

export interface ILinkListingResponse extends ListingResponse {
  results: ILink[]
}

export interface ILinkType {
  name: string
  directed: boolean
  label: string
  phrase: string
}

export interface ILinkTypeListingResponse extends ListingResponse {
  results: ILinkType[]
}

export interface IIdentity {
  key: string
  ref_id?: string
  id: string
  cluster: string
  category: string
  label: string
}


export interface IRefTagListingResponse extends ListingResponse {
  results: IRefTag[]
}