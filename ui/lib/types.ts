
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

export interface IClusterBase {
  id: string
  label: string
  category: string
}

export interface ITag extends IClusterBase {
  cluster: string
  article: string
  fingerprint: string
  count: number
}

export interface IArticleTag extends IClusterBase {
  article: IArticle
  cluster: string
  fingerprint: string
  count: number
  link_type?: string
}

export interface ICluster extends IClusterBase {
  articles: number
}

export interface IClusterDetails extends ICluster {
  labels: string[]
}

export interface IRelatedCluster extends IClusterBase {
  articles: number
  link_types: string[]
}

export interface ISimilarCluster extends IClusterBase {
  common: string[]
  common_count: number
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
