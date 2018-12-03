'use strict';

const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: {type: String, required: true},
  fullname: {type: String}
});

// Add `createdAt` and `updatedAt` fields
userSchema.set('timestamps', true);

// Transform output during `res.json(data)`, `console.log(data)` etc.
userSchema.set('toJSON', {
  virtuals: true,     // include built-in virtual `id`
  transform: (doc, result) => {
    delete result._id;
    delete result.__v;
    delete result.password; // to prevent accidentally returning password
  }
});

module.exports = mongoose.model('user', userSchema);
