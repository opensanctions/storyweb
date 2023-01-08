import { configureStore } from '@reduxjs/toolkit'
import { setupListeners } from '@reduxjs/toolkit/query'
import { articlesApi } from './services/articles'
import { clustersApi } from './services/clusters'
import { linksApi } from './services/links'
import { ontologyApi } from './services/ontology'
import { sitesApi } from './services/sites'
import { storiesApi } from './services/stories'
import { configSlice, hydrate } from './services/config'


export const store = configureStore({
  reducer: {
    [ontologyApi.reducerPath]: ontologyApi.reducer,
    [articlesApi.reducerPath]: articlesApi.reducer,
    [storiesApi.reducerPath]: storiesApi.reducer,
    [clustersApi.reducerPath]: clustersApi.reducer,
    [linksApi.reducerPath]: linksApi.reducer,
    [sitesApi.reducerPath]: sitesApi.reducer,
    config: configSlice.reducer,
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

store.subscribe(() => {
  localStorage.setItem('config', JSON.stringify(store.getState().config))
})

setupListeners(store.dispatch)

const getConfig = () => {
  try {
    const persistedState = localStorage.getItem('config')
    if (persistedState) {
      return JSON.parse(persistedState)
    }
  }
  catch (e) {
    console.log(e)
  }
}

const storedConfig = getConfig()
if (storedConfig) {
  store.dispatch(hydrate(storedConfig))
}

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

