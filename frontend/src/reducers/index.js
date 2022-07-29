import { combineReducers } from 'redux';
import alertData from './alert';
import authData from './auth';
import profileData from './profile';
import accountData from './accounts';

export default combineReducers({
    alertData,
    authData,
    profileData,
    accountData
});
