import { getWithDispatch, postWithDispatch, deleteWithDispatch } from '../utils/request';
import { BUDGET_CATEGORY_RETRIEVED, BUDGET_CATEGORY_FAILED } from './types';
import { createAlert } from './alert';

const modelEndpoint = 'budgetcategories';
const successAction = BUDGET_CATEGORY_RETRIEVED;
const failedAction = BUDGET_CATEGORY_FAILED;

export const getBudgetCategories = () => async (dispatch) => {
  await getWithDispatch(dispatch, modelEndpoint, successAction, failedAction);
};

export const updateBudgetCategory = (budgetCategory) => async (dispatch) => {
  await postWithDispatch(dispatch, modelEndpoint, budgetCategory, failedAction);
  dispatch(createAlert('Budget category has been updated.', 'success'));
  dispatch(getBudgetCategories());
};

export const deleteBudgetCategory = (id) => async (dispatch) => {
  deleteWithDispatch(dispatch, modelEndpoint, id, failedAction);
  dispatch(createAlert('Budget category has been deleted.', 'success'));
  dispatch(getBudgetCategories());
};
