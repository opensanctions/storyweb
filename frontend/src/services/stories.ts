import queryString from 'query-string';
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

import { API_URL } from '../constants'
import type { IListingResponse, IStory, IStoryArticleToggle, IStoryBase } from '../types'

export const storiesApi = createApi({
  reducerPath: 'storiesApi',
  tagTypes: ['Story', 'Article'],
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
    createStory: builder.mutation<IStory, IStoryBase>({
      query(story) {
        return {
          url: `stories`,
          method: 'POST',
          body: story,
        }
      },
      invalidatesTags: ['Story'],
    }),
    toggleStoryArticle: builder.mutation<IStory, IStoryArticleToggle>({
      query(data) {
        return {
          url: `stories/${data.story}/articles`,
          method: 'POST',
          body: { article: data.article },
        }
      },
      invalidatesTags: ['Story', 'Article'],
    }),
  }),
})

export const { useFetchStoryListingQuery, useFetchStoryQuery, useCreateStoryMutation, useToggleStoryArticleMutation } = storiesApi