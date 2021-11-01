import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import { Provider } from 'react-redux';
import React, { useEffect } from 'react';

import store from './store';
import { getTransactions } from './actions/transactions';
// import { getSettings } from './actions/settings';
// import { getDatastore } from './actions/datastore';

import Transactions from './components/pages/Transactions';

import './App.css';

const App = () => {

  useEffect(() => {
    store.dispatch(getTransactions());
  }, []);

  return (
    <Provider store={store}>
      <Router>
        <Switch>
          <Route exact path="/" component={Transactions} />
        </Switch>
      </Router>
    </Provider>
  )
}

export default App;