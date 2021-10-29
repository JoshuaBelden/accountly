import { DATASTORE_LOADED } from './types';
import data from '../data/data.json';

export const getDatastore = () => async dispatch => {
    dispatch({
        type: DATASTORE_LOADED,
        payload: data
    });
};
