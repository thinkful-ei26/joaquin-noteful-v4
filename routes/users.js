'use strict';

const express = require('express');
const mongoose = require('mongoose');

const User = require('../models/user');
const Note = require('../models/note');

const router = express.Router();

/* ========== GET/READ ALL ITEMS ========== */
// router.get('/', (req, res, next) => {

//   User.find()
//     .sort('name')
//     .then(results => {
//       res.json(results);
//     })
//     .catch(err => {
//       next(err);
//     });
// });

/* ========== GET/READ A SINGLE ITEM ========== */
// router.get('/:id', (req, res, next) => {
//   const { id } = req.params;

//   /***** Never trust users - validate input *****/
//   if (!mongoose.Types.ObjectId.isValid(id)) {
//     const err = new Error('The `id` is not valid');
//     err.status = 400;
//     return next(err);
//   }

//   User.findById(id)
//     .then(result => {
//       if (result) {
//         res.json(result);
//       } else {
//         next();
//       }
//     })
//     .catch(err => {
//       next(err);
//     });
// });

/* ========== POST/CREATE AN ITEM ========== */
router
  .post('/', (req, res, next) => {
    const { username, password, fullname = '' } = req.body;
    const newUser = { username, password, fullname };
    User.create(newUser).then(() => {
      return res.status(201).json({
        code: 201,
        username,
        password,
        fullname
      });
    });
  })
  .catch(() => {
    return new Error();
  });

/***** Never trust users - validate input *****/

module.exports = router;
