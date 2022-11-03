import { configureStore } from '@reduxjs/toolkit'
import { setupListeners } from '@reduxjs/toolkit/query'
import { articlesApi } from './services/articles'
import { ontologyApi } from './services/ontology'
import { sitesApi } from './services/sites'

export const store = configureStore({
  reducer: {
    [ontologyApi.reducerPath]: ontologyApi.reducer,
    [articlesApi.reducerPath]: articlesApi.reducer,
    [sitesApi.reducerPath]: sitesApi.reducer,

  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .concat(ontologyApi.middleware)
      .concat(articlesApi.middleware)
      .concat(sitesApi.middleware),
})

setupListeners(store.dispatch)

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

