const { ObjectId } = require('mongoose');
const mongoose = require('mongoose');

const AccountSchema = new mongoose.Schema({
  id: {
    type: ObjectId,
    required: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  accountNumber: {
    type: String,
  },
  routingNumber: {
    type: String,
  },
  balance: {
    type: Number,
    required: true,
  },
});

const Accounts = mongoose.model('accounts', AccountSchema);
module.exports = Accounts;
