import { useState } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { updateIncome } from '../../actions/income';

function IncomeEdit({ income, updateIncome }) {
  const [name, setName] = useState(income.name);
  const [amount, setAmount] = useState(income.amount);
  const [payPeriods, setPayPeriods] = useState(income.payPeriods);

  const handleChange = (event) => {
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
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    updateIncome({
      id: income.id,
      name,
      amount,
      payPeriods,
    });
    clearform();
  };

  const clearform = () => {
    setName(IncomeEdit.defaultProps.income.name);
    setAmount(IncomeEdit.defaultProps.income.amount);
    setPayPeriods(IncomeEdit.defaultProps.income.payPeriods);
  };

  return (
    <div>
      <form className="form" onSubmit={handleSubmit}>
        <div className="form-group">
          <input type="text" id="name" value={name} onChange={handleChange} placeholder="Name" required />
          <input type="text" id="amount" value={amount} onChange={handleChange} placeholder="Amount" required />
          <input
            type="text"
            id="payPeriods"
            value={payPeriods}
            onChange={handleChange}
            placeholder="Pay Periods"
            required
          />
          <input type="submit" value="Save" className="btn btn-primary my-1" />
        </div>
        <input type="hidden" id="id" value={income.id} />
      </form>
    </div>
  );
}

IncomeEdit.propTypes = {
  updateIncome: PropTypes.func,
  income: PropTypes.object,
};

IncomeEdit.defaultProps = {
  income: {
    name: '',
    amount: 0,
    payPeriods: '',
  },
};

const mapStateToProps = () => ({});

export default connect(mapStateToProps, { updateIncome })(IncomeEdit);
