import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'

export interface ConfigState {
  hiddenNodeTypes: string[]
}

const initialState: ConfigState = {
  // hiddenNodeTypes: ['LOC'],
  hiddenNodeTypes: [],
}

export const configSlice = createSlice({
  name: 'config',
  initialState,
  reducers: {
    setHiddenNodeTypes: (state, action: PayloadAction<string[]>) => {
      state.hiddenNodeTypes = action.payload;
    },
    hydrate: (state, action: PayloadAction<ConfigState>) => {
      return { ...initialState, ...action.payload };
    },
  },
})

export const { setHiddenNodeTypes, hydrate } = configSlice.actions

export default configSlice.reducer