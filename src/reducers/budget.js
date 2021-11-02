import { BUDGET_LOADED } from '../actions/types';

const initialState = {
    budget: {
        plans: [],
        categories: [],
        statementSources: []
    }
};

export default function reduce (state = initialState, action) {
    const { type, payload } = action;
    switch (type) {
        case BUDGET_LOADED:
            return payload; // { 'budget' : {...} }
        default:
            return state;
    }
}
