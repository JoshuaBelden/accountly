import { BUDGET_LOADED } from './types';
import budgetData from '../data/budget.json';

export const getBudget = () => dispatch => {
    dispatch({
        type: BUDGET_LOADED,
        payload: budgetData
    });
};
