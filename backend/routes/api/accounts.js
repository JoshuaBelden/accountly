const mongoose = require('mongoose');
const express = require('express');
const { check } = require('express-validator');
const auth = require('../../middleware/auth');
const Account = require('../../models/Account');

const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const records = await Account.find();
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
    check('accountNumber', 'An account number is required').exists(),
    check('balance', 'A balance is required').isNumeric(),
  ],
  auth,
  async (req, res) => {
    const { id = mongoose.Types.ObjectId(), name, accountNumber, routingNumber, balance } = req.body;

    try {
      let record = new Account({
        id,
        name,
        accountNumber,
        routingNumber,
        balance,
      });

      if (!req.body.id) {
        await record.save();
      } else {
        record = await Account.findOneAndUpdate(
          { id },
          {
            $set: {
              id,
              name,
              accountNumber,
              routingNumber,
              balance,
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

router.delete('/:id', auth, async (req, res) => {
  try {
    await Account.deleteOne({ id: req.params.id });
    res.json();
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
