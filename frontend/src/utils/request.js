import axios from 'axios';

const setContentType = () => ({
  headers: {
    'Content-Type': 'application/json',
  },
});

const dispatchError = (dispatch, type, error) => {
  if (error.response) {
    dispatch({
      type: type,
      payload: {
        message: error.response.statusText,
        status: error.response.status,
      },
    });
  } else {
    dispatch({
      type: type,
      payload: {
        message: error,
      },
    });
  }
};

export const getWithDispatch = async (dispatch, model, successAction, failedAction) => {
  try {
    const res = await axios.get(`/api/${model}`);
    dispatch({
      type: successAction,
      payload: res.data,
    });
  } catch (error) {
    dispatchError(dispatch, failedAction, error);
  }
};

export const postWithDispatch = async (dispatch, model, payload, failedAction) => {
  try {
    await axios.post(`/api/${model}`, payload, setContentType());
  } catch (error) {
    dispatchError(dispatch, failedAction, error);
  }
};

export const deleteWithDispatch = async (dispatch, model, id, failedAction) => {
  try {
    await axios.delete(`/api/${model}/${id}`);
  } catch (error) {
    dispatchError(dispatch, failedAction, error);
  }
};
