const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const express = require('express');
const { check, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const gravatar = require('gravatar');
const authSecret = require('../../config/auth-secret');
const auth = require('../../middleware/auth');
const Expenditure = require('../../models/Expenditure');

const router = express.Router();

router.get('/', auth, async (req, res) => {
    try {
        const records = await Expenditure.find();
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
    check('name', 'A name is required').exists(),
    check('amount', 'An amount is required').isNumeric(),
    check('due', 'Due is required').exists(),
    check('autoWithdrawal', 'Auto withdrawal is required').isBoolean()],
    auth, async (req, res) => {

        const {
            id = mongoose.Types.ObjectId(),
            name,
            amount,
            due,
            autoWithdrawal
        } = req.body;

        try {
            let record = new Expenditure({
                id,
                name,
                amount,
                due,
                autoWithdrawal
            });

            if (!req.body.id) {
                await record.save();
            } else {
                record = await BudgeExpenditureCategory.findOneAndUpdate(
                    { id },
                    { $set: {
                        id,
                        name,
                        amount,
                        due,
                        autoWithdrawal
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
