import { LIABILITY_RETRIEVED, LIABILITY_FAILED } from '../actions/types';

const initialState = {
  liabilities: null,
  loading: true,
  error: {},
};

export default function (state = initialState, action) {
  const { type, payload } = action;
  switch (type) {
    case LIABILITY_RETRIEVED:
      return {
        ...state,
        liabilities: payload,
        loading: false,
      };
    case LIABILITY_FAILED:
      return {
        ...state,
        error: payload,
        loading: false,
      };
    default:
      return state;
  }
}
