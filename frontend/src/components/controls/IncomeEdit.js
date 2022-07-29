import React, { useState } from 'react';
import { connect } from 'react-redux';
import { updateIncome } from '../../actions/income';

function IncomeEdit({ income = {}, updateIncome }) {
    const [name, setName] = useState(income.name);
    const [amount, setAmount] = useState(income.amount);
    const [payPeriods, setPayPeriods] = useState(income.payPeriods);

    const handleChange = event => {
        switch (event.target.id) {
            case 'name':
                setName(event.target.value);
                break;
            case 'amount':
                setAmount(event.target.value);
                break;
            case 'payPeriods':
                setPayPeriods(event.target.value);
                break;
            default:
        }
    }

    const handleSubmit = (event) => {
        event.preventDefault();
        updateIncome({
            id: income.id,
            name,
            amount,
            payPeriods
        });
    };

    return (
        <div>
            <form className="form" onSubmit={handleSubmit}>
                <div className="form-group">
                    <label className="form-text">Name:</label>
                    <input type="text" id="name" value={name} onChange={handleChange} />
                </div>
                <div className="form-group">
                    <label className="form-text">Amount:</label>
                    <input type="text" id="amount" value={amount} onChange={handleChange} />
                </div>
                <div className="form-group">
                    <label className="form-text">Pay Periods:</label>
                    <input type="text" id="payPeriods" value={payPeriods} onChange={handleChange} />
                </div>
                <input type="hidden" id="id" value={income.id} />
                <input type="submit" value="Save" className="btn btn-primary my-1" />
            </form>
        </div>
    )
}

const mapStateToProps = state => ({})

export default connect(mapStateToProps, { updateIncome })(IncomeEdit);