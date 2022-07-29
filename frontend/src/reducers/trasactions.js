import { TRANSACTION_RETRIEVED, TRANSACTION_FAILED } from '../actions/types';

const initialState = {
    transactions: null,
    loading: true,
    error: {}
}

export default function (state = initialState, action) {
    const { type, payload } = action;
    switch (type) {
        case TRANSACTION_RETRIEVED:
        return {
            ...state,
            transactions: payload,
            loading: false
        };
        case TRANSACTION_FAILED:
            return {
                ...state,
                error: payload,
                loading: false
            };
        default:
            return state;
    }
}