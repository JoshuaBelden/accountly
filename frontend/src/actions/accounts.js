import axios from "axios"
import { ACCOUNTS_RETRIEVED, ACCOUNTS_FAILED } from "./types";
import { createAlert } from './alert';

export const getAccounts = () => async dispatch => {
    try {
        const res = await axios.get('/api/accounts');
        dispatch({
            type: ACCOUNTS_RETRIEVED,
            payload: res.data
        });
    } catch (error) {
        if (error.response) {
            dispatch({
                type: ACCOUNTS_FAILED,
                payload: {
                    message: error.response.statusText,
                    status: error.response.status
                },
            });
        } else {
            dispatch({
                type: ACCOUNTS_FAILED,
                payload: {
                    message: error
                }
            })
        }
    }
}

export const updateAccount = (account) => async dispatch => {
    try {
        const config = {
            headers: {
                'Content-Type': 'application/json'
            }
        };

        const result = await axios.post('api/accounts', account, config);
        
        dispatch(createAlert('Account has been updated.', 'success'));
        dispatch(getAccounts());
    } catch (error) {
        if (error.response) {
            dispatch({
                type: ACCOUNTS_FAILED,
                payload: {
                    message: error.response.statusText,
                    status: error.response.status
                },
            });
        } else {
            dispatch({
                type: ACCOUNTS_FAILED,
                payload: {
                    message: error
                }
            })
        }
    }
}