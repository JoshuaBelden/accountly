import { CONFIRMATION_HIDE, CONFIRMATION_SHOW } from './types';

export const showConfirmation = (title, header, message, confirmButtonText, action) => async (dispatch) => {
  dispatch({
    type: CONFIRMATION_SHOW,
    payload: {
      title,
      header,
      message,
      confirmButtonText,
      action,
    },
  });
};

export const hideConfirmation = () => async (dispatch) => {
  dispatch({
    type: CONFIRMATION_HIDE,
  });
};
