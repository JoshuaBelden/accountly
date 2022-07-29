import React, { useState } from 'react';
import { connect } from 'react-redux';
import { updateAccount } from '../../actions/accounts';

function AccountEdit({ account = {}, updateAccount }) {
    const [name, setName] = useState(account.name);
    const [accountNumber, setAccountNumber] = useState(account.accountNumber);
    const [routingNumber, setRoutingNumber] = useState(account.routingNumber);
    const [balance, setBalance] = useState(account.balance);

    const handleChange = event => {
        switch (event.target.id) {
            case 'name':
                setName(event.target.value);
                break;
            case 'accountNumber':
                setAccountNumber(event.target.value);
                break;
            case 'routingNumber':
                setRoutingNumber(event.target.value);
                break;
            case 'balance':
                setBalance(event.target.value);
                break;
            default:
        }
    }

    const handleSubmit = (event) => {
        event.preventDefault();
        updateAccount({
            id: account.id,
            name,
            accountNumber,
            routingNumber,
            balance
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
                    <label className="form-text">Account Number:</label>
                    <input type="text" id="accountNumber" value={accountNumber} onChange={handleChange} />
                </div>
                <div className="form-group">
                    <label className="form-text">Routing Number:</label>
                    <input type="text" id="routingNumber" value={routingNumber || ''} onChange={handleChange} />
                </div>
                <div className="form-group">
                    <label className="form-text">Balance:</label>
                    <input type="text" id="balance" value={balance} onChange={handleChange} />
                </div>

                <input type="hidden" id="id" value={account.id} />
                <input type="submit" value="Save" className="btn btn-primary my-1" />
            </form>
        </div>
    )
}

const mapStateToProps = state => ({})

export default connect(mapStateToProps, { updateAccount })(AccountEdit);