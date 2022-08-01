import { getWithDispatch, postWithDispatch, deleteWithDispatch } from '../utils/request';
import { EXPENDITURE_RETRIEVED, EXPENDITURE_FAILED } from './types';
import { createAlert } from './alert';

const modelEndpoint = 'expenditures';
const successAction = EXPENDITURE_RETRIEVED;
const failedAction = EXPENDITURE_FAILED;

export const getExpenditures = () => async (dispatch) => {
  await getWithDispatch(dispatch, modelEndpoint, successAction, failedAction);
};

export const updateExpenditure = (expenditure) => async (dispatch) => {
  await postWithDispatch(dispatch, modelEndpoint, expenditure, failedAction);
  dispatch(createAlert('Expenditure has been updated.', 'success'));
  dispatch(getExpenditures());
};

export const deleteExpenditure = (id) => async (dispatch) => {
  deleteWithDispatch(dispatch, modelEndpoint, id, failedAction);
  dispatch(createAlert('Expenditure has been deleted.', 'success'));
  dispatch(getExpenditures());
};
