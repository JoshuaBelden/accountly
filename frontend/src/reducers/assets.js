import { ASSETS_RETRIEVED, ASSETS_FAILED } from '../actions/types';

const initialState = {
    assets: null,
    loading: true,
    error: {}
}

export default function (state = initialState, action) {
    const { type, payload } = action;
    switch (type) {
        case ASSETS_RETRIEVED:
        return {
            ...state,
            assets: payload,
            loading: false
        };
        case ASSETS_FAILED:
            return {
                ...state,
                error: payload,
                loading: false
            };
        default:
            return state;
    }
}