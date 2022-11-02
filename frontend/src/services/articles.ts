import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

import { API_URL } from '../constants'
import type { IOntology } from '../types'

export const articlesApi = createApi({
  reducerPath: 'articlesApi',
  tagTypes: ['Article'],
  baseQuery: fetchBaseQuery({ baseUrl: API_URL }),
  endpoints: (builder) => ({
    fetchArticle: builder.query<IOntology, string>({
      query: (articleId) => `articles/${articleId}`,
      // providesTags: () => [{ type: "Article" }]
    }),
  }),
})

export const { useFetchArticleQuery } = articlesApi