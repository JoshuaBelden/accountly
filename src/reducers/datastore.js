import { DATASTORE_LOADED, TRANSACTIONS_IMPORTED } from '../actions/types';

const initialState = {
    datastore: {
        transactions: []
    }
};

export default function reduce (state = initialState, action) {
    console.debug('[jcbdbg] datastore::reduce state, action', state, action);
    const { type, payload } = action;
    switch (type) {
        case DATASTORE_LOADED:
            return payload;
        case TRANSACTIONS_IMPORTED:
            state.datastore.transactions.push(payload);
            return state; 
        default:
            return state;
    }
}
