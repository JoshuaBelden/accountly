import { BUDGET_CATEGORY_RETRIEVED, BUDGET_CATEGORY_FAILED } from '../actions/types';

const initialState = {
  budgetCategories: null,
  loading: true,
  error: {},
};

export default function (state = initialState, action) {
  const { type, payload } = action;
  switch (type) {
    case BUDGET_CATEGORY_RETRIEVED:
      return {
        ...state,
        budgetCategories: payload,
        loading: false,
      };
    case BUDGET_CATEGORY_FAILED:
      return {
        ...state,
        error: payload,
        loading: false,
      };
    default:
      return state;
  }
}
