const { ObjectId } = require('mongoose');
const mongoose = require('mongoose');

const AssetSchema = new mongoose.Schema({
  id: {
    type: ObjectId,
    required: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  value: {
    type: Number,
    required: true,
  },
});

const Assets = mongoose.model('assets', AssetSchema);
module.exports = Assets;
