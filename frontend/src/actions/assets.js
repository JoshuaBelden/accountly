import { getWithDispatch, postWithDispatch, deleteWithDispatch } from '../utils/request';
import { ASSETS_RETRIEVED, ASSETS_FAILED } from './types';
import { createAlert } from './alert';

const modelEndpoint = 'assets';
const successAction = ASSETS_RETRIEVED;
const failedAction = ASSETS_FAILED;

export const getAssets = () => async (dispatch) => {
  await getWithDispatch(dispatch, modelEndpoint, successAction, failedAction);
};

export const updateAsset = (asset) => async (dispatch) => {
  await postWithDispatch(dispatch, modelEndpoint, asset, failedAction);
  dispatch(createAlert('Asset has been updated.', 'success'));
  dispatch(getAssets());
};

export const deleteAsset = (id) => async (dispatch) => {
  deleteWithDispatch(dispatch, modelEndpoint, id, failedAction);
  dispatch(createAlert('Asset has been deleted.', 'success'));
  dispatch(getAssets());
};
