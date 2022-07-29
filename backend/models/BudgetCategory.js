const { ObjectId } = require('mongoose');
const mongoose = require('mongoose');

const BudgetItemSchema = new mongoose.Schema({
    id: {
        type: ObjectId,
        required: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    amount: {
        type: Number,
        required: true
    }
});

module.exports = BudgetItems = mongoose.model('budgetitems', BudgetItemSchema);