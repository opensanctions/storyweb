
export interface IResponse {
  status: string
  debug_msg?: string
}

export interface IListingResponse<T> extends IResponse {
  limit: number
  offset: number
  total: number
  results: T[]
}

export interface IArticle {
  id: string
  title: string
  site: string
  url: string
  language: string
  tags: number
  mentions: number
}

export interface IArticleDetails extends IArticle {
  text: string
}

export interface IStoryMutation {
  title: string
  summary: string
}

export interface IStory extends IStoryMutation {
  id: number
}

export interface IStoryArticleToggle {
  story: number
  article: string
}

export interface IStoryArticleImport {
  story: number
  url: string
}

export interface IClusterBase {
  id: string
  label: string
  type: string
}

export interface ICluster extends IClusterBase {
  articles: number
}

export interface IClusterDetails extends ICluster {
  labels: string[]
}

export interface IClusterPair {
  left: IClusterBase,
  right: IClusterBase,
  link_types: string[]
  articles: number
}

export interface IRelatedCluster extends IClusterBase {
  articles: number
  link_types: string[]
}

export interface ISimilarCluster extends IClusterBase {
  common: string[]
  common_count: number
}

export interface IClusterMerge {
  anchor: string
  other: string[]
}

export interface IUntagArticle {
  cluster: string
  article: string
}

export interface ILinkPredict {
  anchor: string
  other: string
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


export interface ILinkPrediction {
  source: IClusterDetails
  target: IClusterDetails
  type: string
}


export interface ILinkType {
  name: string
  directed: boolean
  label: string
  phrase: string
  source_type: string
  target_type: string
}

export interface IClusterType {
  name: string
  label: string
  plural: string
  parent?: string
  color: string
  icon: string
}

export interface IOntology {
  link_types: ILinkType[]
  cluster_types: IClusterType[]
}
