import { useState } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { updateLiability } from '../../actions/liabilities';

function LiabilityEdit({ liability, updateLiability }) {
  const [name, setName] = useState(liability.name);
  const [balance, setBalance] = useState(liability.balance);
  const [due, setDue] = useState(liability.due);
  const [autoWithdrawal, setAutoWithdrawal] = useState(liability.autoWithdrawal);

  const handleChange = (event) => {
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
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    updateLiability({
      id: liability.id,
      name,
      balance,
      due,
      autoWithdrawal,
    });
    clearform();
  };

  const clearform = () => {
    setName(LiabilityEdit.defaultProps.liability.name);
    setBalance(LiabilityEdit.defaultProps.liability.balance);
    setDue(LiabilityEdit.defaultProps.liability.due);
    setAutoWithdrawal(LiabilityEdit.defaultProps.liability.autoWithdrawal);
  };

  return (
    <div>
      <form className="form" onSubmit={handleSubmit}>
        <div className="form-group">
          <input type="text" id="name" value={name} onChange={handleChange} placeholder="Name" required />
          <input type="text" id="balance" value={balance} onChange={handleChange} placeholder="Balance" required />
          <input type="text" id="due" value={due} onChange={handleChange} placeholder="Due" required />
          <input type="checkbox" id="autoWithdrawal" value={autoWithdrawal} onChange={handleChange} />
          <input type="submit" value="Save" className="btn btn-primary my-1" />
        </div>
        <input type="hidden" id="id" value={liability.id} />
      </form>
    </div>
  );
}

LiabilityEdit.propTypes = {
  updateLiability: PropTypes.func,
  liability: PropTypes.object,
};

LiabilityEdit.defaultProps = {
  liability: {
    name: '',
    balance: 0,
    due: '',
    autoWithdrawal: true,
  },
};

const mapStateToProps = () => ({});

export default connect(mapStateToProps, { updateLiability })(LiabilityEdit);
