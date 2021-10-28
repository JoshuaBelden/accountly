import { SETTINGS_LOADED } from '../actions/types';

const initialState = {
    settings: null
}

export default function reduce (state = initialState, action) {
    const { type, payload } = action;
    switch (type) {
        case SETTINGS_LOADED:
            return payload;
        default:
            return state;
    }
}
