

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

export interface IIdentity {
  key: string
  ref_id?: string
  id: string
  cluster: string
}

export interface IRefTagListingResponse extends ListingResponse {
  results: IRefTag[]
}