import { useState } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { updateExpenditure } from '../../actions/expenditures';

function ExpenditureEdit({ expenditure, updateExpenditure }) {
  const [name, setName] = useState(expenditure.name);
  const [amount, setAmount] = useState(expenditure.amount);
  const [due, setDue] = useState(expenditure.due);
  const [autoWithdrawal, setAutoWithdrawal] = useState(expenditure.autoWithdrawal);

  const handleChange = (event) => {
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
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    updateExpenditure({
      id: expenditure.id,
      name,
      amount,
      due,
      autoWithdrawal,
    });
    clearform();
  };

  const clearform = () => {
    setName(ExpenditureEdit.defaultProps.expenditure.name);
    setAmount(ExpenditureEdit.defaultProps.expenditure.amount);
    setDue(ExpenditureEdit.defaultProps.expenditure.due);
    setAutoWithdrawal(ExpenditureEdit.defaultProps.expenditure.autoWithdrawal);
  };

  return (
    <div>
      <form className="form" onSubmit={handleSubmit}>
        <div className="form-group">
          <input type="text" id="name" value={name} onChange={handleChange} placeholder="Name" required />
          <input type="text" id="amount" value={amount} onChange={handleChange} placeholder="Amount" required />
          <input type="text" id="due" value={due} onChange={handleChange} placeholder="Due" required />
          <input type="checkbox" id="autoWithdrawal" value={autoWithdrawal} onChange={handleChange} />
          <input type="submit" value="Save" className="btn btn-primary my-1" />
        </div>
        <input type="hidden" id="id" value={expenditure.id} />
      </form>
    </div>
  );
}

ExpenditureEdit.propTypes = {
  updateExpenditure: PropTypes.func,
  expenditure: PropTypes.object,
};

ExpenditureEdit.defaultProps = {
  expenditure: {
    name: '',
    amount: 0,
    due: '',
    autoWithdrawal: true,
  },
};

const mapStateToProps = () => ({});

export default connect(mapStateToProps, { updateExpenditure })(ExpenditureEdit);
