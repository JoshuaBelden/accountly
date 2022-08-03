import React, { useState } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { showConfirmation } from '../../actions/confirmations';
import { updateBudgetCategory, deleteBudgetCategory } from '../../actions/budgetCategories';

function BudgetCategoryEdit({ budgetCategory, showConfirmation, updateBudgetCategory, deleteBudgetCategory }) {
  const [name, setName] = useState(budgetCategory.name);
  const [amount, setAmount] = useState(budgetCategory.amount);

  const handleChange = (event) => {
    switch (event.target.id) {
      case 'name':
        setName(event.target.value);
        break;
      case 'amount':
        setAmount(event.target.value);
        break;
      default:
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    updateBudgetCategory({
      id: budgetCategory.id,
      name,
      amount,
    });

    if (!budgetCategory.id) {
      clearform();
    }
  };

  const handleDelete = () => {
    showConfirmation(
      'Delete Confirmation',
      'Delete Confirmation',
      'Are you sure you want to delete this record?',
      'Delete',
      () => {
        deleteBudgetCategory(budgetCategory.id);
      },
    );
  };

  const clearform = () => {
    setName(BudgetCategoryEdit.defaultProps.budgetCategory.name);
    setAmount(BudgetCategoryEdit.defaultProps.budgetCategory.amount);
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
        <input type="hidden" id="id" value={budgetCategory.id} />
        <input type="submit" value="Save" className="btn btn-primary my-1" />
        {budgetCategory.id && (
          <input type="button" value="Delete" onClick={handleDelete} className="btn btn-primary my-1" />
        )}
      </form>
    </div>
  );
}

BudgetCategoryEdit.propTypes = {
  budgetCategory: PropTypes.object,
  showConfirmation: PropTypes.func,
  updateBudgetCategory: PropTypes.func,
  deleteBudgetCategory: PropTypes.func,
};

BudgetCategoryEdit.defaultProps = {
  budgetCategory: {
    name: '',
    amount: 0,
  },
};

const mapStateToProps = () => ({});

export default connect(mapStateToProps, { showConfirmation, updateBudgetCategory, deleteBudgetCategory })(
  BudgetCategoryEdit,
);
