import { configureStore } from '@reduxjs/toolkit'
import { setupListeners } from '@reduxjs/toolkit/query'
import { articlesApi } from './services/articles'
import { clustersApi } from './services/clusters'
import { linksApi } from './services/links'
import { ontologyApi } from './services/ontology'
import { sitesApi } from './services/sites'
import { storiesApi } from './services/stories'

export const store = configureStore({
  reducer: {
    [ontologyApi.reducerPath]: ontologyApi.reducer,
    [articlesApi.reducerPath]: articlesApi.reducer,
    [storiesApi.reducerPath]: storiesApi.reducer,
    [clustersApi.reducerPath]: clustersApi.reducer,
    [linksApi.reducerPath]: linksApi.reducer,
    [sitesApi.reducerPath]: sitesApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .concat(ontologyApi.middleware)
      .concat(articlesApi.middleware)
      .concat(storiesApi.middleware)
      .concat(clustersApi.middleware)
      .concat(linksApi.middleware)
      .concat(sitesApi.middleware),
})

setupListeners(store.dispatch)

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

