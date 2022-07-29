import { ACCOUNTS_RETRIEVED, ACCOUNTS_FAILED } from '../actions/types';

const initialState = {
    accounts: null,
    loading: true,
    error: {}
}

export default function (state = initialState, action) {
    const { type, payload } = action;
    switch (type) {
        case ACCOUNTS_RETRIEVED:
        return {
            ...state,
            accounts: payload,
            loading: false
        };
        case ACCOUNTS_FAILED:
            return {
                ...state,
                error: payload,
                loading: false
            };
        default:
            return state;
    }
}