const mongoose = require('mongoose');
const express = require('express');
const { check } = require('express-validator');
const auth = require('../../middleware/auth');
const Liability = require('../../models/Liability');

const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const records = await Liability.find();
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
    check('balance', 'A balance is required').isNumeric(),
    check('due', 'Due is required').isNumeric(),
    check('autoWithdrawal', 'Auto withdrawal is required').isBoolean(),
  ],
  auth,
  async (req, res) => {
    const { id = mongoose.Types.ObjectId(), name, balance, due, autoWithdrawal } = req.body;

    try {
      let record = new Liability({
        id,
        name,
        balance,
        due,
        autoWithdrawal,
      });

      if (!req.body.id) {
        await record.save();
      } else {
        record = await Liability.findOneAndUpdate(
          { id },
          {
            $set: {
              id,
              name,
              balance,
              due,
              autoWithdrawal,
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
    await Liability.deleteOne({ id: req.params.id });
    res.json();
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
