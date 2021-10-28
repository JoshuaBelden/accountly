import { combineReducers } from 'redux';
import settings from './settings';
import datastore from './datastore';

export default combineReducers({
    settings,
    datastore
});
