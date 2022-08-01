import { combineReducers } from 'redux';
import accountData from './accounts';
import alertData from './alert';
import assetData from './assets';
import authData from './auth';
import budgetCategoryData from './budgetCategories';
import confirmationData from './confirmations';
import expenditureData from './expenditures';
import incomeData from './income';
import liabilityData from './liabilities';
import profileData from './profile';
import trasactionData from './trasactions';

export default combineReducers({
  accountData,
  alertData,
  assetData,
  authData,
  budgetCategoryData,
  confirmationData,
  expenditureData,
  incomeData,
  liabilityData,
  profileData,
  trasactionData,
});
