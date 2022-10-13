

export interface IResponse {
  status: string
  debug_msg?: string
}

export interface IListingResponse extends IResponse {
  limit: number
  offset: number
}

export interface IArticle {
  id: string
  title: string
  site: string
  url: string
}


export interface ITag {
  id: string
  cluster: string
  article: string
  fingerprint: string
  category: string
  label: string
  count: number
}

export interface IArticleTag {
  article: IArticle
  id: string
  cluster: string
  fingerprint: string
  category: string
  label: string
  count: number
  link_type?: string
}

export interface ISite {
  site: string
  articles: number
}

export interface ISiteListingResponse extends IListingResponse {
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

export interface ILinkListingResponse extends IListingResponse {
  results: ILink[]
}

export interface ILinkType {
  name: string
  directed: boolean
  label: string
  phrase: string
}

export interface ILinkTypeListingResponse extends IListingResponse {
  results: ILinkType[]
}



export interface IArticleTagListingResponse extends IListingResponse {
  results: IArticleTag[]
}