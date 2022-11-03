import queryString from 'query-string';
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

import { API_URL } from '../constants'
import { ICluster, IClusterDetails, IClusterMerge, IListingResponse, IRelatedCluster, ISimilarCluster } from '../types'

type IClusterQueryParams = {
  cluster: ICluster,
  params?: any
}

export const clustersApi = createApi({
  reducerPath: 'clustersApi',
  tagTypes: ['Cluster'],
  baseQuery: fetchBaseQuery({ baseUrl: API_URL }),
  endpoints: (builder) => ({
    fetchCluster: builder.query<IClusterDetails, string>({
      query: (clusterId) => `clusters/${clusterId}`,
      providesTags: () => [{ type: "Cluster" }]
    }),
    fetchClusterListing: builder.query<IListingResponse<ICluster>, any>({
      query: (params) => queryString.stringifyUrl({
        'url': `clusters`,
        'query': params
      }),
      providesTags: () => [{ type: "Cluster" }]
    }),
    fetchSimilarClusterListing: builder.query<IListingResponse<ISimilarCluster>, IClusterQueryParams>({
      query: ({ cluster, params }) => queryString.stringifyUrl({
        'url': `clusters/${cluster.id}/similar`,
        'query': params
      }),
      providesTags: () => [{ type: "Cluster" }]
    }),
    fetchRelatedClusterListing: builder.query<IListingResponse<IRelatedCluster>, IClusterQueryParams>({
      query: ({ cluster, params }) => queryString.stringifyUrl({
        'url': `clusters/${cluster.id}/related`,
        'query': params
      }),
      providesTags: () => [{ type: "Cluster" }]
    }),
    mergeClusters: builder.mutation<IClusterDetails, IClusterMerge>({
      query(merge) {
        return {
          url: `links/_merge`,
          method: 'POST',
          body: merge,
        }
      },
      invalidatesTags: () => ['Cluster'],
    })
  }),
})

export const {
  useFetchClusterListingQuery,
  useFetchClusterQuery,
  useFetchSimilarClusterListingQuery,
  useFetchRelatedClusterListingQuery,
  useMergeClustersMutation
} = clustersApi