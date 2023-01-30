import queryString from 'query-string';
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

import { API_URL } from '../constants'
import { IClusterDetails, ILink, ILinkPredict, ILinkPrediction, IListingResponse, IUntagArticle } from '../types'


export const linksApi = createApi({
  reducerPath: 'linksApi',
  tagTypes: ['Cluster', 'Link'],
  refetchOnMountOrArgChange: true,
  baseQuery: fetchBaseQuery({ baseUrl: API_URL }),
  endpoints: (builder) => ({
    fetchLinks: builder.query<IListingResponse<ILink>, any>({
      query: (params) => queryString.stringifyUrl({
        'url': `links`,
        'query': params
      }),
      providesTags: ['Link'],
    }),
    fetchPrediction: builder.query<ILinkPrediction, ILinkPredict>({
      query: (params) => queryString.stringifyUrl({
        'url': `links/_predict`,
        'query': { ...params }
      }),
      providesTags: ['Cluster', 'Link'],
    }),
    saveLink: builder.mutation<ILink, Partial<ILink>>({
      query(link) {
        return {
          url: `links`,
          method: 'POST',
          body: link,
        }
      },
      invalidatesTags: ['Cluster', 'Link'],
    }),
    explodeCluster: builder.mutation<IClusterDetails, string>({
      query(clusterId) {
        return {
          url: `links/_explode`,
          method: 'POST',
          body: { cluster: clusterId },
        }
      },
      invalidatesTags: ['Cluster', 'Link'],
    }),
    untagArticle: builder.mutation<IClusterDetails, IUntagArticle>({
      query(untag) {
        return {
          url: `links/_untag`,
          method: 'POST',
          body: untag,
        }
      },
      invalidatesTags: ['Cluster', 'Link'],
    }),
  }),
})

export const {
  useSaveLinkMutation,
  useFetchPredictionQuery,
  useExplodeClusterMutation,
  useUntagArticleMutation,
  useFetchLinksQuery,
} = linksApi