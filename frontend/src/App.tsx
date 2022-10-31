import React from 'react';
import { RouterProvider } from 'react-router-dom';
import { Provider } from 'react-redux'

import { store } from './store';
import { router } from './router';

import './styles/App.scss';


function App() {
  return (
    <Provider store={store}>
      <RouterProvider router={router} />
    </Provider>
  );
}

export default App;
