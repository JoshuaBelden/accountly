import { DATASTORE_LOADED } from './types';

const datastore = {
    accounts: []
};

export const getDatastore = () => async dispatch => {
    dispatch({
        type: DATASTORE_LOADED,
        payload: datastore
    });
};
