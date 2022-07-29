import { EXPENDITURE_RETRIEVED, EXPENDITURE_FAILED } from '../actions/types';

const initialState = {
    expenditures: null,
    loading: true,
    error: {}
}

export default function (state = initialState, action) {
    const { type, payload } = action;
    switch (type) {
        case EXPENDITURE_RETRIEVED:
        return {
            ...state,
            expenditures: payload,
            loading: false
        };
        case EXPENDITURE_FAILED:
            return {
                ...state,
                error: payload,
                loading: false
            };
        default:
            return state;
    }
}