import axios from 'axios';
import { INCOME_RETRIEVED, INCOME_FAILED } from './types';
import { createAlert } from './alert';

export const getIncome = () => async (dispatch) => {
  try {
    const res = await axios.get('/api/income');
    dispatch({
      type: INCOME_RETRIEVED,
      payload: res.data,
    });
  } catch (error) {
    if (error.response) {
      dispatch({
        type: INCOME_FAILED,
        payload: {
          message: error.response.statusText,
          status: error.response.status,
        },
      });
    } else {
      dispatch({
        type: INCOME_FAILED,
        payload: {
          message: error,
        },
      });
    }
  }
};

export const updateIncome = (income) => async (dispatch) => {
  try {
    const config = {
      headers: {
        'Content-Type': 'application/json',
      },
    };

    await axios.post('api/income', income, config);

    dispatch(createAlert('Income has been updated.', 'success'));
    dispatch(getIncome());
  } catch (error) {
    if (error.response) {
      dispatch({
        type: INCOME_FAILED,
        payload: {
          message: error.response.statusText,
          status: error.response.status,
        },
      });
    } else {
      dispatch({
        type: INCOME_FAILED,
        payload: {
          message: error,
        },
      });
    }
  }
};
