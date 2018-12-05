'use strict';

const mongoose = require('mongoose');

const tagSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true }
});

// Add `createdAt` and `updatedAt` fields
tagSchema.set('timestamps', true);

// Transform output during `res.json(data)`, `console.log(data)` etc.
tagSchema.set('toJSON', {
  virtuals: true,     // include built-in virtual `id`
  transform: (doc, result) => {
    delete result._id;
    delete result.__v;
  }
});

module.exports = mongoose.model('Tag', tagSchema);
