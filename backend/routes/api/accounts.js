const bcrypt = require('bcryptjs');
const express = require('express');
const auth = require('../../middleware/auth');
const { check, validationResult } = require('express-validator');
const Account = require('../../models/Account');
const jwt = require('jsonwebtoken');
const gravatar = require('gravatar');
const authSecret = require('../../config/auth-secret');
const mongoose = require('mongoose');

const router = express.Router();

router.get('/', auth, async (req, res) => {
    try {
        const accounts = await Account.find();

        if (!accounts) {
            return res.status(404).json({ message: 'There are no accounts.' });
        }

        res.json(accounts);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

router.post('/', auth, async (req, res) => {
    const {
        id,
        name,
        payPeriods,
        estimatedAmount
    } = req.body;

    try {
        let account = new Account({
            id: mongoose.Types.ObjectId(),
            name,
            payPeriods,
            estimatedAmount
        });

        if (!id) {
            await account.save();
        } else {
            account = await Account.findOneAndUpdate(
                { id },
                { $set: {
                    name,
                    payPeriods,
                    estimatedAmount
                } },
                { new: true }
            );
        }
        
        res.json(account);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server error');
    }
})
module.exports = router;
