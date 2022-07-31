import { INCOME_RETRIEVED, INCOME_FAILED } from '../actions/types';

const initialState = {
  income: null,
  loading: true,
  error: {},
};

export default function (state = initialState, action) {
  const { type, payload } = action;
  switch (type) {
    case INCOME_RETRIEVED:
      return {
        ...state,
        income: payload,
        loading: false,
      };
    case INCOME_FAILED:
      return {
        ...state,
        error: payload,
        loading: false,
      };
    default:
      return state;
  }
}
