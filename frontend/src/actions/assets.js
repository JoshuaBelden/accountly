import axios from 'axios';
import { ASSETS_RETRIEVED, ASSETS_FAILED } from './types';
import { createAlert } from './alert';

export const getAssets = () => async (dispatch) => {
  try {
    const res = await axios.get('/api/assets');
    dispatch({
      type: ASSETS_RETRIEVED,
      payload: res.data,
    });
  } catch (error) {
    if (error.response) {
      dispatch({
        type: ASSETS_FAILED,
        payload: {
          message: error.response.statusText,
          status: error.response.status,
        },
      });
    } else {
      dispatch({
        type: ASSETS_FAILED,
        payload: {
          message: error,
        },
      });
    }
  }
};

export const updateAsset = (asset) => async (dispatch) => {
  try {
    const config = {
      headers: {
        'Content-Type': 'application/json',
      },
    };

    await axios.post('api/assets', asset, config);

    dispatch(createAlert('Asset has been updated.', 'success'));
    dispatch(getAssets());
  } catch (error) {
    if (error.response) {
      dispatch({
        type: ASSETS_FAILED,
        payload: {
          message: error.response.statusText,
          status: error.response.status,
        },
      });
    } else {
      dispatch({
        type: ASSETS_FAILED,
        payload: {
          message: error,
        },
      });
    }
  }
};
