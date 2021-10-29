import { DATASTORE_LOADED } from './types';
import data from '../data/data.json';
import { v4 as uuid } from 'uuid';
import _ from 'lodash';
import moment from 'moment';

export const getDatastore = () => dispatch => {
    dispatch({
        type: DATASTORE_LOADED,
        payload: data
    });
};

export const importStatement = (datastore, statement) => dispatch => {

    const transactions = [];
    const lines = _.take(_.tail(statement.split('\r\n')), 10);
    _.each(lines, line => {
        const details = line.split(',');
        transactions.push({
            id: uuid(),
            description: details[3].replace('"', ''),
            date: new moment(details[1], 'MM/DD/YYYY'),
            amount: parseFloat(details[4])
        })
    });
 
    datastore.transactions.push(...transactions);

    dispatch({
        type: DATASTORE_LOADED,
        payload: datastore
    });
};
