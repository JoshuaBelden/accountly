const { ObjectId, Date } = require('mongoose');
const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
  id: {
    type: ObjectId,
    required: true,
  },
  description: {
    type: String,
    required: true,
    trim: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
});

const Transactions = mongoose.model('transactions', TransactionSchema);
module.exports = Transactions;
