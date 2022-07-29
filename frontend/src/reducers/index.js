import { combineReducers } from 'redux';
import alertData from './alert';
import authData from './auth';
import profileData from './profile';
import accountData from './accounts';
import assetData from './assets';
import budgetCategoryData from './budgetCategories';
import expenditureData from './expenditures';
import incomeData from './income';
import liabilityData from './liabilities';
import trasactionData from './trasactions';

export default combineReducers({
    alertData,
    authData,
    profileData,
    accountData,
    assetData,
    budgetCategoryData,
    expenditureData,
    incomeData,
    liabilityData,
    trasactionData
});
