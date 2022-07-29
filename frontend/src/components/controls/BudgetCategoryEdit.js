import React, { useState } from 'react';
import { connect } from 'react-redux';
import { updateBudgetCategory } from '../../actions/budgetCategories';

function BudgetCategoryEdit({ budgetCategory = {}, updateAsset }) {
    const [name, setName] = useState(budgetCategory.name);
    const [amount, setAmount] = useState(budgetCategory.amount);

    const handleChange = event => {
        switch (event.target.id) {
            case 'name':
                setName(event.target.value);
                break;
            case 'amount':
                setAmount(event.target.value);
                break;
            default:
        }
    }

    const handleSubmit = (event) => {
        event.preventDefault();
        updateBudgetCategory({
            id: budgetCategory.id,
            name,
            amount
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
                <input type="hidden" id="id" value={budgetCategory.id} />
                <input type="submit" value="Save" className="btn btn-primary my-1" />
            </form>
        </div>
    )
}

const mapStateToProps = state => ({})

export default connect(mapStateToProps, { updateBudgetCategory })(BudgetCategoryEdit);