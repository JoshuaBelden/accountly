import { CONFIRMATION_SHOW, CONFIRMATION_HIDE } from '../actions/types';

const initialState = {
  show: false,
};

export default function (state = initialState, action) {
  const { type, payload } = action;
  switch (type) {
    case CONFIRMATION_SHOW:
      return {
        ...state,
        ...payload,
        show: true,
      };
    case CONFIRMATION_HIDE:
      return {
        ...state,
        show: false,
      };
    default:
      return state;
  }
}
