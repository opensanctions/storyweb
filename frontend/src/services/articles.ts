import queryString from 'query-string';
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

import { API_URL } from '../constants'
import type { IArticle, IArticleDetails, IListingResponse } from '../types'

export const articlesApi = createApi({
  reducerPath: 'articlesApi',
  tagTypes: ['Article'],
  baseQuery: fetchBaseQuery({ baseUrl: API_URL }),
  endpoints: (builder) => ({
    fetchArticle: builder.query<IArticleDetails, string>({
      query: (articleId) => `articles/${articleId}`,
      providesTags: ["Article"]
    }),
    fetchArticleListing: builder.query<IListingResponse<IArticle>, any>({
      query: (params) => queryString.stringifyUrl({
        'url': `articles`,
        'query': params
      }),
      providesTags: ["Article"]
    }),
  }),
})

export const { useFetchArticleQuery, useFetchArticleListingQuery } = articlesApi