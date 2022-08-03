import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import axios from 'axios';
import React, { useEffect } from 'react';

import { loadUser } from './actions/auth';
import setAuthToken from './utils/setAuthToken';
import store from './store';

import Dashboard from './components/pages/Dashboard';
import { Page } from './components/pages/Page';
import Confirmation from './components/modals/Confirmation';
import AlertList from './components/layout/Alert';

if (localStorage.token) {
  setAuthToken(localStorage.token);
}

if (process.env.NODE_ENV === 'production') {
  axios.defaults.baseURL = 'https://api.accountly.com';
} else {
  axios.defaults.baseURL = 'http://localhost:7001';
}

const App = () => {
  useEffect(() => {
    store.dispatch(loadUser());
  });

  return (
    <Provider store={store}>
      <Confirmation />
      <AlertList />
      <BrowserRouter>
        <Routes>
          <Route exact path="/" element={<Dashboard />} />
          <Route path="/*" element={<Page />} />
        </Routes>
      </BrowserRouter>
    </Provider>
  );
};

export default App;
