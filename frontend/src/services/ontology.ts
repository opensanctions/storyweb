import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

import { API_URL } from '../constants'
import type { IOntology } from '../types'

export const ontologyApi = createApi({
  reducerPath: 'ontologyApi',
  baseQuery: fetchBaseQuery({ baseUrl: API_URL }),
  endpoints: (builder) => ({
    fetchOntology: builder.query<IOntology, void>({
      query: () => `ontology`,
    }),
  }),
})

export const { useFetchOntologyQuery } = ontologyApi