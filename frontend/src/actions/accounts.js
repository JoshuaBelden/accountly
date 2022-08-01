import { getWithDispatch, postWithDispatch, deleteWithDispatch } from '../utils/request';
import { ACCOUNTS_RETRIEVED, ACCOUNTS_FAILED } from './types';
import { createAlert } from './alert';

const modelEndpoint = 'accounts';
const successAction = ACCOUNTS_RETRIEVED;
const failedAction = ACCOUNTS_FAILED;

export const getAccounts = () => async (dispatch) => {
  await getWithDispatch(dispatch, modelEndpoint, successAction, failedAction);
};

export const updateAccount = (account) => async (dispatch) => {
  await postWithDispatch(dispatch, modelEndpoint, account, failedAction);
  dispatch(createAlert('Account has been updated.', 'success'));
  dispatch(getAccounts());
};

export const deleteAccount = (id) => async (dispatch) => {
  deleteWithDispatch(dispatch, modelEndpoint, id, failedAction);
  dispatch(createAlert('Account has been deleted.', 'success'));
  dispatch(getAccounts());
};
