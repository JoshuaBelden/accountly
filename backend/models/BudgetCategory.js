const { ObjectId } = require('mongoose');
const mongoose = require('mongoose');

const BudgetItemSchema = new mongoose.Schema({
  id: {
    type: ObjectId,
    required: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  amount: {
    type: Number,
    required: true,
  },
});

const BudgetItems = mongoose.model('budgetitems', BudgetItemSchema);
module.exports = BudgetItems;
