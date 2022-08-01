import { useState } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { showConfirmation } from '../../actions/confirmations';
import { deleteAccount, updateAccount } from '../../actions/accounts';

function AccountEdit({ account, showConfirmation, updateAccount, deleteAccount }) {
  const [name, setName] = useState(account.name);
  const [accountNumber, setAccountNumber] = useState(account.accountNumber);
  const [routingNumber, setRoutingNumber] = useState(account.routingNumber);
  const [balance, setBalance] = useState(account.balance);

  const handleChange = (event) => {
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
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    updateAccount({
      id: account.id,
      name,
      accountNumber,
      routingNumber,
      balance,
    });

    if (!account.id) {
      clearForm();
    }
  };

  const handleDelete = () => {
    showConfirmation(
      'Delete Confirmation',
      'Delete Confirmation',
      'Are you sure you want to delete this record?',
      'Delete',
      () => {
        deleteAccount(account.id);
      },
    );
  };

  const clearForm = () => {
    setName(AccountEdit.defaultProps.account.name);
    setAccountNumber(AccountEdit.defaultProps.account.accountNumber);
    setRoutingNumber(AccountEdit.defaultProps.account.routingNumber);
    setBalance(AccountEdit.defaultProps.account.balance);
  };

  return (
    <div>
      <form className="form" onSubmit={handleSubmit}>
        <div className="form-group">
          <input type="text" id="name" value={name} onChange={handleChange} placeholder="Name" required />
          <input
            type="text"
            id="accountNumber"
            value={accountNumber}
            onChange={handleChange}
            placeholder="Account Number"
            required
          />
          <input
            type="text"
            id="routingNumber"
            value={routingNumber || ''}
            onChange={handleChange}
            placeholder="Routing Number"
            required
          />
          <input type="text" id="balance" value={balance} onChange={handleChange} placeholder="Balance" required />
          <input type="submit" value="Save" className="btn btn-primary my-1" />
          {account.id && <input type="button" value="Delete" onClick={handleDelete} className="btn btn-primary my-1" />}
        </div>

        <input type="hidden" id="id" value={account.id} />
      </form>
    </div>
  );
}

AccountEdit.propTypes = {
  showConfirmation: PropTypes.func,
  updateAccount: PropTypes.func,
  deleteAccount: PropTypes.func,
  account: PropTypes.object,
};

AccountEdit.defaultProps = {
  account: {
    name: '',
    accountNumber: '',
    routingNumber: '',
    balance: 0,
  },
};

const mapStateToProps = () => ({});

export default connect(mapStateToProps, { showConfirmation, updateAccount, deleteAccount })(AccountEdit);
