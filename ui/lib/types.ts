

export interface IResponse {
  status: string
  debug_msg?: string
}

export interface IListingResponse<T> extends IResponse {
  limit: number
  offset: number
  results: T[]
}

export interface IArticle {
  id: string
  title: string
  site: string
  url: string
  tags_count: number
  tags_mentions: number
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


export interface ICluster {
  id: string
  category: string
  label: string
  labels: string[]
  count: number
  tags: number
  link_type?: string
}


export interface ISite {
  site: string
  articles: number
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


export interface ILinkType {
  name: string
  directed: boolean
  label: string
  phrase: string
}
