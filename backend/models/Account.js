const { ObjectId } = require('mongoose');
const mongoose = require('mongoose');

const AccountSchema = new mongoose.Schema({
    id: {
        type: ObjectId,
        required: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    payPeriods: {
        type: String,
        required: true
    },
    estimatedAmount: {
        type: Number,
        required: true
    }
});

module.exports = Accounts = mongoose.model('accounts', AccountSchema);