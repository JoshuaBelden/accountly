import React, { useState } from 'react';
import { connect } from 'react-redux';
import { updateExpenditure } from '../../actions/expenditures';

function ExpenditureEdit({ expenditure = {}, updateExpenditure }) {
    const [name, setName] = useState(expenditure.name);
    const [amount, setAmount] = useState(expenditure.amount);
    const [due, setDue] = useState(expenditure.due);
    const [autoWithdrawal, setAutoWithdrawal] = useState(expenditure.autoWithdrawal);

    const handleChange = event => {
        switch (event.target.id) {
            case 'name':
                setName(event.target.value);
                break;
            case 'amount':
                setAmount(event.target.value);
                break;
            case 'due':
                setDue(event.target.value);
                break;
            case 'autoWithdrawal':
                setAutoWithdrawal(event.target.value);
                break;
            default:
        }
    }

    const handleSubmit = (event) => {
        event.preventDefault();
        updateExpenditure({
            id: expenditure.id,
            name,
            amount,
            due,
            autoWithdrawal
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
                    <label className="form-text">Due:</label>
                    <input type="text" id="due" value={due} onChange={handleChange} />
                </div>
                <div className="form-group">
                    <label className="form-text">Auto Withdrawal:</label>
                    <input type="text" id="autoWithdrawal" value={autoWithdrawal} onChange={handleChange} />
                </div>
                <input type="hidden" id="id" value={expenditure.id} />
                <input type="submit" value="Save" className="btn btn-primary my-1" />
            </form>
        </div>
    )
}

const mapStateToProps = state => ({})

export default connect(mapStateToProps, { updateExpenditure })(ExpenditureEdit);