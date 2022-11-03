import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

import { API_URL } from '../constants'
import type { IListingResponse, ISite } from '../types'

export const sitesApi = createApi({
  reducerPath: 'sitesApi',
  baseQuery: fetchBaseQuery({ baseUrl: API_URL }),
  endpoints: (builder) => ({
    fetchSites: builder.query<IListingResponse<ISite>, void>({
      query: () => `sites`,
    }),
  }),
})

export const { useFetchSitesQuery } = sitesApi