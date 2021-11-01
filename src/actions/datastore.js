import { DATASTORE_LOADED, TRANSACTIONS_IMPORTED } from './types';
import data from '../data/data.json';
import { v4 as uuid } from 'uuid';
import _ from 'lodash';
import moment from 'moment';

export const getDatastore = () => dispatch => {
    dispatch({
        type: DATASTORE_LOADED,
        payload: {
            datastore: data
        }
    });
};
