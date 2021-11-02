import _ from 'lodash';
import { v4 as uuid } from 'uuid';

export const createTransaction = (description, date, amount) => ({
    id: uuid(),
    description,
    date,
    amount
});

export const mapTransaction = (transaction, maps) => ({
    target: findTarget(transaction, maps),
    ...transaction
});

export const findTarget = (transaction, maps) =>
    _.get(_.find(maps, map => isMatch(transaction, map)), 'target');

export const isMatch = (transaction, map) =>
    _.some(map.matches, pattern => new RegExp(pattern, 'i').test(transaction.description));