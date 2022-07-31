import axios from 'axios';
import { TRANSACTION_RETRIEVED, TRANSACTION_FAILED } from './types';
import { createAlert } from './alert';

export const getTrasactions = () => async (dispatch) => {
  try {
    const res = await axios.get('/api/transactions');
    dispatch({
      type: TRANSACTION_RETRIEVED,
      payload: res.data,
    });
  } catch (error) {
    if (error.response) {
      dispatch({
        type: TRANSACTION_FAILED,
        payload: {
          message: error.response.statusText,
          status: error.response.status,
        },
      });
    } else {
      dispatch({
        type: TRANSACTION_FAILED,
        payload: {
          message: error,
        },
      });
    }
  }
};

export const updateTransaction = (transaction) => async (dispatch) => {
  try {
    const config = {
      headers: {
        'Content-Type': 'application/json',
      },
    };

    await axios.post('api/transactions', transaction, config);

    dispatch(createAlert('Transaction has been updated.', 'success'));
    dispatch(getTrasactions());
  } catch (error) {
    if (error.response) {
      dispatch({
        type: TRANSACTION_FAILED,
        payload: {
          message: error.response.statusText,
          status: error.response.status,
        },
      });
    } else {
      dispatch({
        type: TRANSACTION_FAILED,
        payload: {
          message: error,
        },
      });
    }
  }
};
