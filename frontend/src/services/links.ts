import queryString from 'query-string';
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

import { API_URL } from '../constants'
import { ILink, IListingResponse } from '../types'


export const linksApi = createApi({
  reducerPath: 'linksApi',
  tagTypes: ['Cluster'],
  baseQuery: fetchBaseQuery({ baseUrl: API_URL }),
  endpoints: (builder) => ({
    fetchLinks: builder.query<IListingResponse<ILink>, any>({
      query: (params) => queryString.stringifyUrl({
        'url': `links`,
        'query': params
      }),
      providesTags: () => ["Cluster"]
    }),
    saveLink: builder.mutation<ILink, Partial<ILink>>({
      query(link) {
        return {
          url: `links`,
          method: 'POST',
          body: link,
        }
      },
      invalidatesTags: ['Cluster'],
    })
  }),
})

export const {
  useSaveLinkMutation,
  useFetchLinksQuery
} = linksApi