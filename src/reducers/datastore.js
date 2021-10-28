import { DATASTORE_LOADED } from '../actions/types';

const initialState = {
    datastore: null
}

export default function reduce (state = initialState, action) {
    const { type, payload } = action;
    switch (type) {
        case DATASTORE_LOADED:
            return payload;
        default:
            return state;
    }
}
