const { ObjectId } = require('mongoose');
const mongoose = require('mongoose');

const IncomeSchema = new mongoose.Schema({
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
    amount: {
        type: Number,
        required: true
    }
});

module.exports = Income = mongoose.model('Income', IncomeSchema);