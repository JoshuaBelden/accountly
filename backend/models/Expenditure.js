const { ObjectId } = require('mongoose');
const mongoose = require('mongoose');

const ExpenditureSchema = new mongoose.Schema({
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
    },
    due: {
        type: Number,
        required: true
    },
    autoWithdrawal: {
        type: Boolean,
        required: true
    }
});

module.exports = Expenditures = mongoose.model('expenditures', ExpenditureSchema);