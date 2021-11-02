import _ from 'lodash';
import moment from 'moment';

import { TRANSACTIONS_LOADED, TRANSACTIONS_IMPORTED } from './types';
import transactions from '../data/transactions.json';
import { createTransaction, mapTransaction } from '../lib/transactions';

export const getTransactions = () => dispatch => {
    dispatch({
        type: TRANSACTIONS_LOADED,
        payload: transactions
    });
};

export const importStatement = (budget, statement) => dispatch => {

    const transactions = [];
    const lines = _.take(_.tail(statement.split('\r\n')), 10);
    _.each(lines, line => {
        const details = line.split(',');
        const description = details[3].replace('"', '');
        const date = new moment(details[1], 'MM/DD/YYYY');
        const amount = parseFloat(details[4]);
        let transaction = createTransaction(description, date, amount);
        transaction = mapTransaction(transaction, budget.statementSources[0].transactionMap);
        transactions.push(transaction);
    });

    dispatch({
        type: TRANSACTIONS_IMPORTED,
        payload: transactions
    });
};