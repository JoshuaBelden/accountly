const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const express = require('express');
const { check, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const gravatar = require('gravatar');
const authSecret = require('../../config/auth-secret');
const auth = require('../../middleware/auth');
const Transaction = require('../../models/Transaction');

const router = express.Router();

router.get('/', auth, async (req, res) => {
    try {
        const records = await Transaction.find();
        if (!records) {
            return res.status(404).json({ message: 'There are no records.' });
        }

        res.json(records);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

router.post('/', [
    check('description', 'A description is required').exists(),
    check('amount', 'An amount is required').isNumeric(),
    check('date', 'A date is required').isDate()],
    auth, async (req, res) => {

        const {
            id = mongoose.Types.ObjectId(),
            description,
            amount,
            date
        } = req.body;

        try {
            let record = new Transaction({
                id,
                description,
                amount,
                date
            });

            if (!req.body.id) {
                await record.save();
            } else {
                record = await Transaction.findOneAndUpdate(
                    { id },
                    { $set: {
                        id,
                        description,
                        amount,
                        date
                    }},
                    { new: true }
                );
            }
            res.json(record);
        } catch (error) {
            console.error(error.message);
            res.status(500).send('Server error');
        }
    })
module.exports = router;
