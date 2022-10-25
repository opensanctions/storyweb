

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
  tags_count: number
  tags_mentions: number
}

export interface IArticleListingResponse extends IListingResponse {
  results: IArticle[]
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

export interface IArticleTagListingResponse extends IListingResponse {
  results: IArticleTag[]
}

export interface ICluster {
  id: string
  category: string
  label: string
  labels: string[]
  count: number
  tags: number
  link_type?: string
}

export interface IClusterListingResponse extends IListingResponse {
  results: ICluster[]
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
