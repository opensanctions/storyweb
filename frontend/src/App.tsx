import React from 'react';
import { RouterProvider } from 'react-router-dom';
import { Provider } from 'react-redux'
import { FocusStyleManager } from "@blueprintjs/core"

import { store } from './store';
import { router } from './router';

import './styles/App.scss';

FocusStyleManager.onlyShowFocusOnTabs();

function App() {
  return (
    <Provider store={store}>
      <RouterProvider router={router} />
    </Provider>
  );
}

export default App;
