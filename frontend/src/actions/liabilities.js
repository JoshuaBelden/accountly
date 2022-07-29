import axios from "axios"
import { LIABILITY_RETRIEVED, LIABILITY_FAILED } from "./types";
import { createAlert } from './alert';

export const getLiabilities = () => async dispatch => {
    try {
        const res = await axios.get('/api/liabilities');
        dispatch({
            type: LIABILITY_RETRIEVED,
            payload: res.data
        });
    } catch (error) {
        if (error.response) {
            dispatch({
                type: LIABILITY_FAILED,
                payload: {
                    message: error.response.statusText,
                    status: error.response.status
                },
            });
        } else {
            dispatch({
                type: LIABILITY_FAILED,
                payload: {
                    message: error
                }
            })
        }
    }
}

export const updateLiability = (liability) => async dispatch => {
    try {
        const config = {
            headers: {
                'Content-Type': 'application/json'
            }
        };

        await axios.post('api/liabilities', liability, config);
        
        dispatch(createAlert('Liability has been updated.', 'success'));
        dispatch(getLiabilities());
    } catch (error) {
        if (error.response) {
            dispatch({
                type: LIABILITY_FAILED,
                payload: {
                    message: error.response.statusText,
                    status: error.response.status
                },
            });
        } else {
            dispatch({
                type: LIABILITY_FAILED,
                payload: {
                    message: error
                }
            })
        }
    }
}