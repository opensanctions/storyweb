import queryString from 'query-string';
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

import { API_URL } from '../constants'
import type { IListingResponse, IStory } from '../types'

export const storiesApi = createApi({
  reducerPath: 'storiesApi',
  tagTypes: ['Story'],
  baseQuery: fetchBaseQuery({ baseUrl: API_URL }),
  endpoints: (builder) => ({
    fetchStory: builder.query<IStory, string>({
      query: (articleId) => `stories/${articleId}`,
      providesTags: ["Story"]
    }),
    fetchStoryListing: builder.query<IListingResponse<IStory>, any>({
      query: (params) => queryString.stringifyUrl({
        'url': `stories`,
        'query': params
      }),
      providesTags: ["Story"]
    }),
  }),
})

export const { useFetchStoryListingQuery, useFetchStoryQuery } = storiesApi