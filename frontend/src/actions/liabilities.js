import { getWithDispatch, postWithDispatch, deleteWithDispatch } from '../utils/request';
import { LIABILITY_RETRIEVED, LIABILITY_FAILED } from './types';
import { createAlert } from './alert';

const modelEndpoint = 'liabilities';
const successAction = LIABILITY_RETRIEVED;
const failedAction = LIABILITY_FAILED;

export const getLiabilities = () => async (dispatch) => {
  await getWithDispatch(dispatch, modelEndpoint, successAction, failedAction);
};

export const updateLiability = (liability) => async (dispatch) => {
  await postWithDispatch(dispatch, modelEndpoint, liability, failedAction);
  dispatch(createAlert('Liability has been updated.', 'success'));
  dispatch(getLiabilities());
};

export const deleteLiability = (id) => async (dispatch) => {
  deleteWithDispatch(dispatch, modelEndpoint, id, failedAction);
  dispatch(createAlert('Liability has been deleted.', 'success'));
  dispatch(getLiabilities());
};
