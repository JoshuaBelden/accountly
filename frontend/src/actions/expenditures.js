import axios from "axios"
import { EXPENDITURE_RETRIEVED, EXPENDITURE_FAILED } from "./types";
import { createAlert } from './alert';

export const getExpenditures = () => async dispatch => {
    try {
        const res = await axios.get('/api/expenditures');
        dispatch({
            type: EXPENDITURE_RETRIEVED,
            payload: res.data
        });
    } catch (error) {
        if (error.response) {
            dispatch({
                type: EXPENDITURE_FAILED,
                payload: {
                    message: error.response.statusText,
                    status: error.response.status
                },
            });
        } else {
            dispatch({
                type: EXPENDITURE_FAILED,
                payload: {
                    message: error
                }
            })
        }
    }
}

export const updateExpenditure = (expenditure) => async dispatch => {
    try {
        const config = {
            headers: {
                'Content-Type': 'application/json'
            }
        };

        await axios.post('api/expenditures', expenditure, config);
        
        dispatch(createAlert('Expenditure has been updated.', 'success'));
        dispatch(getExpenditures());
    } catch (error) {
        if (error.response) {
            dispatch({
                type: EXPENDITURE_FAILED,
                payload: {
                    message: error.response.statusText,
                    status: error.response.status
                },
            });
        } else {
            dispatch({
                type: EXPENDITURE_FAILED,
                payload: {
                    message: error
                }
            })
        }
    }
}