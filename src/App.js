import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import { Provider } from 'react-redux';
import React, { useEffect } from 'react';

import store from './store';
import { getBudget } from './actions/budget';
import { getTransactions } from './actions/transactions';
// import { getSettings } from './actions/settings';

import Transactions from './components/pages/Transactions';

import './App.css';

const App = () => {

  useEffect(() => {
    store.dispatch(getBudget());
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