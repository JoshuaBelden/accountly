const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const express = require('express');
const { check, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const gravatar = require('gravatar');
const authSecret = require('../../config/auth-secret');
const auth = require('../../middleware/auth');
const Asset = require('../../models/Asset');

const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const records = await Asset.find();
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
  [check('name', 'A name is required').exists(), check('value', 'A value is required').isNumeric()],
  auth,
  async (req, res) => {
    const { id = mongoose.Types.ObjectId(), name, value } = req.body;

    try {
      let record = new Asset({
        id,
        name,
        value,
      });

      if (!req.body.id) {
        await record.save();
      } else {
        record = await Asset.findOneAndUpdate(
          { id },
          {
            $set: {
              id,
              name,
              value,
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
