import { getWithDispatch, postWithDispatch, deleteWithDispatch } from '../utils/request';
import { TRANSACTION_RETRIEVED, TRANSACTION_FAILED } from './types';
import { createAlert } from './alert';

const modelEndpoint = 'transactions';
const successAction = TRANSACTION_RETRIEVED;
const failedAction = TRANSACTION_FAILED;

export const getTransactions = () => async (dispatch) => {
  await getWithDispatch(dispatch, modelEndpoint, successAction, failedAction);
};

export const updateTransaction = (transaction) => async (dispatch) => {
  await postWithDispatch(dispatch, modelEndpoint, transaction, failedAction);
  dispatch(createAlert('Transaction has been updated.', 'success'));
  dispatch(getTransactions());
};

export const deleteTransaction = (id) => async (dispatch) => {
  deleteWithDispatch(dispatch, modelEndpoint, id, failedAction);
  dispatch(createAlert('Transaction has been deleted.', 'success'));
  dispatch(getTransactions());
};
