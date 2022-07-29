import React, { useState } from 'react';
import { connect } from 'react-redux';
import { updateAccount } from '../../actions/accounts';

function AccountRow({ account = {}, updateAccount }) {
    const [name, setName] = useState(account.name);
    const [payPeriods, setPayPeriods] = useState(account.payPeriods);
    const [estimatedAmount, setEstimatedAmount] = useState(account.estimatedAmount);

    const handleChange = event => {
        switch (event.target.id) {
            case 'name':
                setName(event.target.value);
                break;
            case 'payPeriods':
                setPayPeriods(event.target.value);
                break;
            case 'estimatedAmount':
                setEstimatedAmount(event.target.value);
                break;
            default:
        }
    }

    const handleSubmit = (event) => {
        event.preventDefault();
        updateAccount({
            id: account.id,
            name,
            payPeriods,
            estimatedAmount
        });
    };

    return (
        <div>
            <form className="form" onSubmit={handleSubmit}>
                <input type="hidden" id="id" value={account.id} />
                <div className="form-group">
                    <label className="form-text">Name:</label>
                    <input type="text" id="name" value={name} onChange={handleChange} />
                </div>
                <div className="form-group">
                    <label className="form-text">Pay Periods:</label>
                    <input type="text" id="payPeriods" value={payPeriods} onChange={handleChange} />
                </div>
                <div className="form-group">
                    <label className="form-text">Amount:</label>
                    <input type="text" id="estimatedAmount" value={estimatedAmount} onChange={handleChange} />
                </div>

                <input type="submit" value="Save" className="btn btn-primary my-1" />
            </form>
        </div>
    )
}

const mapStateToProps = state => ({})

export default connect(mapStateToProps, { updateAccount })(AccountRow);