import queryString from 'query-string';
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

import { API_URL } from '../constants'
import type { ICluster, IClusterDetails, IListingResponse } from '../types'

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
  }),
})

export const { useFetchClusterListingQuery, useFetchClusterQuery } = clustersApi