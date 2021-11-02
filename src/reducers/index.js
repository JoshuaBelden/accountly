import { combineReducers } from 'redux';
import transactionData from './transactions';
import budgetData from './budget';

export default combineReducers({
    budgetData,
    transactionData
});
