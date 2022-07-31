const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const express = require('express');
const { check, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const gravatar = require('gravatar');
const authSecret = require('../../config/auth-secret');
const auth = require('../../middleware/auth');
const Income = require('../../models/Income');

const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const records = await Income.find();
    if (!records) {
      return res.status(404).json({ message: 'There are no records.' });
    }

    res.json(records);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

router.post(
  '/',
  [
    check('name', 'A name is required').exists(),
    check('payPeriods', 'Pay periods is required').exists(),
    check('amount', 'An amount is required').isNumeric(),
  ],
  auth,
  async (req, res) => {
    const { id = mongoose.Types.ObjectId(), name, payPeriods, amount } = req.body;

    try {
      let record = new Income({
        id,
        name,
        payPeriods,
        amount,
      });

      if (!req.body.id) {
        await record.save();
      } else {
        record = await Income.findOneAndUpdate(
          { id },
          {
            $set: {
              id,
              name,
              payPeriods,
              amount,
            },
          },
          { new: true },
        );
      }
      res.json(record);
    } catch (error) {
      console.error(error.message);
      res.status(500).send('Server error');
    }
  },
);
module.exports = router;
