import { getWithDispatch, postWithDispatch, deleteWithDispatch } from '../utils/request';
import { INCOME_RETRIEVED, INCOME_FAILED } from './types';
import { createAlert } from './alert';

const modelEndpoint = 'income';
const successAction = INCOME_RETRIEVED;
const failedAction = INCOME_FAILED;

export const getIncome = () => async (dispatch) => {
  await getWithDispatch(dispatch, modelEndpoint, successAction, failedAction);
};

export const updateIncome = (income) => async (dispatch) => {
  await postWithDispatch(dispatch, modelEndpoint, income, failedAction);
  dispatch(createAlert('Income has been updated.', 'success'));
  dispatch(getIncome());
};

export const deleteIncome = (id) => async (dispatch) => {
  deleteWithDispatch(dispatch, modelEndpoint, id, failedAction);
  dispatch(createAlert('Income has been deleted.', 'success'));
  dispatch(getIncome());
};
