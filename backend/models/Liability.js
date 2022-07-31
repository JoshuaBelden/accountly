const { ObjectId } = require('mongoose');
const mongoose = require('mongoose');

const LiabilitySchema = new mongoose.Schema({
  id: {
    type: ObjectId,
    required: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  balance: {
    type: Number,
    required: true,
  },
  due: {
    type: Number,
    required: true,
  },
  autoWithdrawal: {
    type: Boolean,
    required: true,
  },
});

const Liabilities = mongoose.model('liabilities', LiabilitySchema);
module.exports = Liabilities;
