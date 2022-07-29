import React, { useState } from 'react';
import { connect } from 'react-redux';
import { updateLiability } from '../../actions/liabilities';

function LiabilityEdit({ liability = {}, updateLiability }) {
    const [name, setName] = useState(liability.name);
    const [balance, setBalance] = useState(liability.balance);
    const [due, setDue] = useState(liability.due);
    const [autoWithdrawal, setAutoWithdrawal] = useState(liability.autoWithdrawal);

    const handleChange = event => {
        switch (event.target.id) {
            case 'name':
                setName(event.target.value);
                break;
            case 'balance':
                setBalance(event.target.value);
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
        updateLiability({
            id: liability.id,
            name,
            balance,
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
                    <label className="form-text">Balance:</label>
                    <input type="text" id="balance" value={balance} onChange={handleChange} />
                </div>
                <div className="form-group">
                    <label className="form-text">Due:</label>
                    <input type="text" id="due" value={due} onChange={handleChange} />
                </div>
                <div className="form-group">
                    <label className="form-text">Auto Withdrawal:</label>
                    <input type="text" id="autoWithdrawal" value={autoWithdrawal} onChange={handleChange} />
                </div>
                <input type="hidden" id="id" value={liability.id} />
                <input type="submit" value="Save" className="btn btn-primary my-1" />
            </form>
        </div>
    )
}

const mapStateToProps = state => ({})

export default connect(mapStateToProps, { updateLiability })(LiabilityEdit);