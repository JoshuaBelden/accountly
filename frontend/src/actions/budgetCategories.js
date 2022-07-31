import axios from 'axios';
import { BUDGET_CATEGORY_RETRIEVED, BUDGET_CATEGORY_FAILED } from './types';
import { createAlert } from './alert';

export const getBudgetCategories = () => async (dispatch) => {
  try {
    const res = await axios.get('/api/budgetcategories');
    dispatch({
      type: BUDGET_CATEGORY_RETRIEVED,
      payload: res.data,
    });
  } catch (error) {
    if (error.response) {
      dispatch({
        type: BUDGET_CATEGORY_FAILED,
        payload: {
          message: error.response.statusText,
          status: error.response.status,
        },
      });
    } else {
      dispatch({
        type: BUDGET_CATEGORY_FAILED,
        payload: {
          message: error,
        },
      });
    }
  }
};

export const updateBudgetCategory = (budgetCategory) => async (dispatch) => {
  try {
    const config = {
      headers: {
        'Content-Type': 'application/json',
      },
    };

    await axios.post('api/budgetcategories', budgetCategory, config);

    dispatch(createAlert('Budget category has been updated.', 'success'));
    dispatch(getBudgetCategories());
  } catch (error) {
    if (error.response) {
      dispatch({
        type: BUDGET_CATEGORY_FAILED,
        payload: {
          message: error.response.statusText,
          status: error.response.status,
        },
      });
    } else {
      dispatch({
        type: ACCOUNTS_FAILED,
        payload: {
          message: error,
        },
      });
    }
  }
};
