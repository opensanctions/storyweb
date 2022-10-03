

export interface Response {
  status: string
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
  count: number
}

export interface ISite {
  site: string
  ref_count: number
}

export interface ISiteListingResponse extends ListingResponse {
  results: ISite[]
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