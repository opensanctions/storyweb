import queryString from 'query-string';
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

import { API_URL } from '../constants'
import { IClusterDetails, ILink, IListingResponse } from '../types'


export const linksApi = createApi({
  reducerPath: 'linksApi',
  tagTypes: ['Cluster', 'Link'],
  baseQuery: fetchBaseQuery({ baseUrl: API_URL }),
  endpoints: (builder) => ({
    fetchLinks: builder.query<IListingResponse<ILink>, any>({
      query: (params) => queryString.stringifyUrl({
        'url': `links`,
        'query': params
      }),
      providesTags: ['Link'],
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
  }),
})

export const {
  useSaveLinkMutation,
  useExplodeClusterMutation,
  useFetchLinksQuery
} = linksApi