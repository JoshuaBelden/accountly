import _ from 'lodash';
import moment from 'moment';
import { v4 as uuid } from 'uuid';

import transactions from '../data/transactions.json';
import { TRANSACTIONS_LOADED, TRANSACTIONS_IMPORTED } from './types';

export const getTransactions = () => dispatch => {
    dispatch({
        type: TRANSACTIONS_LOADED,
        payload: transactions
    });
};

export const importStatement = statement => dispatch => {

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

    dispatch({
        type: TRANSACTIONS_IMPORTED,
        payload: transactions
    });
};