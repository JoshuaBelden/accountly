import { TRANSACTIONS_LOADED, TRANSACTIONS_IMPORTED } from '../actions/types';

const initialState = {
    transactions: []
};

export default function reduce(state = initialState, action) {
    const { type, payload } = action;
    switch (type) {
        case TRANSACTIONS_LOADED:
            return payload; // { 'transactions' : [...] }
        case TRANSACTIONS_IMPORTED:
            return {
                transactions: [...state.transactions, ...payload]
            };
        default:
            return state;
    }
}
