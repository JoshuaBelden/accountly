import { SETTINGS_LOADED } from './types';

const settings = {
    enabled: true
}

export const getSettings = () => async dispatch => {
    dispatch({
        type: SETTINGS_LOADED,
        payload: settings
    });
}
