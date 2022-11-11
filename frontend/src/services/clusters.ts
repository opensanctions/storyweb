import queryString from 'query-string';
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

import { API_URL } from '../constants'
import { ICluster, IClusterDetails, IClusterMerge, IListingResponse, IRelatedCluster, ISimilarCluster } from '../types'

type IClusterQueryParams = {
  clusterId: string,
  params?: any
}

export const clustersApi = createApi({
  reducerPath: 'clustersApi',
  tagTypes: ['Cluster', 'Link'],
  baseQuery: fetchBaseQuery({ baseUrl: API_URL }),
  endpoints: (builder) => ({
    fetchCluster: builder.query<IClusterDetails, string>({
      query: (clusterId) => `clusters/${clusterId}`,
      providesTags: ["Cluster"]
    }),
    fetchClusterListing: builder.query<IListingResponse<ICluster>, any>({
      query: (params) => queryString.stringifyUrl({
        'url': `clusters`,
        'query': params
      }),
      providesTags: ["Cluster"]
    }),
    fetchSimilarClusterListing: builder.query<IListingResponse<ISimilarCluster>, IClusterQueryParams>({
      query: ({ clusterId, params }) => queryString.stringifyUrl({
        'url': `clusters/${clusterId}/similar`,
        'query': params
      }),
      providesTags: ["Cluster", "Link"]
    }),
    fetchRelatedClusterListing: builder.query<IListingResponse<IRelatedCluster>, IClusterQueryParams>({
      query: ({ clusterId, params }) => queryString.stringifyUrl({
        'url': `clusters/${clusterId}/related`,
        'query': params
      }),
      providesTags: ["Cluster", "Link"]
    }),
    mergeClusters: builder.mutation<IClusterDetails, IClusterMerge>({
      query(merge) {
        return {
          url: `links/_merge`,
          method: 'POST',
          body: merge,
        }
      },
      invalidatesTags: ['Cluster', 'Link'],
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