'use strict';

const express = require('express');
const mongoose = require('mongoose');

const Note = require('../models/note');
const Folder = require('../models/folder');
const Tag = require('../models/tag');

const router = express.Router();
const passport = require('passport');

router.use(
  '/',
  passport.authenticate('jwt', { session: false, failWithError: true })
);

const validateTagsForUser = function(tags, userId) {
  if (tags === undefined) {
    // This allows for no tags, withour error
    return Promise.resolve();
  }
  // Check that tags are presented in an array.
  if (!Array.isArray(tags)) {
    const e = new Error('Tags need to be in an array');
    e.status = 400;
    return Promise.reject(e);
  }
  // Check that all array elements are valid (loop through the array with a mongoose validation check).
  const badTag = tags.filter(tag => !mongoose.Types.ObjectId.isValid(tag));
  if (badTag.length) {
    const e = new Error('There is an invalid tag in the array');
    e.status = 400;
    return Promise.reject(e);
  }

  return Tag.find({ $and: [{ _id: { $in: tags }, userId }] }) //loop the tag array and return a new array of all two way matches with tag and user id.
    .then(result => {
      if (tags.length !== result.length) {
        const e = new Error('The tags array contains an invalid tag');
        e.status = 400;
        return Promise.reject();
      }
    });
};
const validateFoldersForUser = function(folderId, userId) {
  // console.log('inputs to folder validation', folderId, userId);
  if (folderId === undefined) {
    // this says that no folder designation is ok per schema
    // .resolve() i think acts like next() and just moves along the chain. Not sure why we have this code block.
    return Promise.resolve();
  }
  if (!mongoose.Types.ObjectId.isValid(folderId)) {
    const e = new Error('Invalid folder Id');
    e.status = 400;
    return Promise.reject(e);
  }
  return Folder.countDocuments({ _id: folderId, userId }) // count all folders with two-way match on current user and folder Id.
    .then(count => {
      // console.log('count here--', count);
      if (count === 0) {
        const e = new Error('The folder id is invalid');
        e.status = 400;
        return Promise.reject(e);
      }
    });
};

/* ========== GET/READ ALL ITEMS ========== */
router.get('/', (req, res, next) => {
  const { searchTerm, folderId, tagId } = req.query;
  const userId = req.user.id;

  let filter = { userId };

  if (searchTerm) {
    const re = new RegExp(searchTerm, 'i');
    filter.$or = [{ title: re }, { content: re }];
  }

  if (folderId) {
    filter.folderId = folderId;
  }

  if (tagId) {
    filter.tags = tagId;
  }

  Note.find(filter)
    .populate('tags')
    .sort({ updatedAt: 'desc' })
    .then(results => {
      res.json(results);
    })
    .catch(err => {
      next(err);
    });
});

/* ========== GET/READ A SINGLE ITEM ========== */
router.get('/:id', (req, res, next) => {
  const { id } = req.params;
  const userId = req.user.id; // linking notes to users.

  /***** Never trust users - validate input *****/
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const err = new Error('The `id` is not valid');
    err.status = 400;
    return next(err);
  }

  // Note.findById(id)
  Note.findOne({ _id: id, userId })
    .populate('tags')
    .then(result => {
      if (result) {
        res.json(result);
      } else {
        next();
      }
    })
    .catch(err => {
      next(err);
    });
});

/* ========== POST/CREATE AN ITEM ========== */
router.post('/', (req, res, next) => {
  const { title, content, folderId, tags } = req.body;
  const userId = req.user.id;
  // console.log('tags', tags);

  /***** Never trust users - validate input *****/
  if (!title) {
    const err = new Error('Missing `title` in request body');
    err.status = 400;
    return next(err);
  }

  const newNote = { title, content, folderId, tags, userId };
  // console.log('newNote.tags', newNote.tags);

  if (newNote.folderId === '') {
    delete newNote.folderId;
  }
  Promise.all([
    validateFoldersForUser(newNote.folderId, userId),
    validateTagsForUser(newNote.tags, userId)
  ])
    .then(() => Note.create(newNote))
    .then(result => {
      res
        .location(`${req.originalUrl}/${result.id}`)
        .status(201)
        .json(result);
    })
    .catch(e => {
      console.error(e);
      next(e);
    });
});

/***************THIS CODE BLOCK PRECEDES THE ISOLATION OF TAG-FOLDER POST-PUT FUNCTIONS*****
  if (newNote.folderId === '') { // if no folderId is provided delete the field.
    delete newNote.folderId;
  }

  if (folderId && !mongoose.Types.ObjectId.isValid(folderId)) { // if there is a folderId but it is not valid, throw an error
    const err = new Error('The `folderId` is not valid');
    err.status = 400;
    return next(err);
  }

  if (tags) { // if tag id's are included, validate them.
    const badIds = tags.filter(tag => !mongoose.Types.ObjectId.isValid(tag));
    if (badIds.length) {
      const err = new Error('The `tags` array contains an invalid `id`');
      err.status = 400;
      return next(err);
    }
  } */

// Note.create(newNote) //
//   .then(result => {
//     res
//       .location(`${req.originalUrl}/${result.id}`)
//       .status(201)
//       .json(result);
//   })
//   .catch(err => {
//     next(err);
//   });

/* ========== PUT/UPDATE A SINGLE ITEM ========== */

router.put('/:id', (req, res, next) => {
  const noteId = req.params.id;
  const userId = req.user.id;

  const toUpdate = {};
  const updateableFields = ['title', 'content', 'folderId', 'tags'];

  let filter = { userId };

  updateableFields.forEach(field => {
    if (field in req.body) {
      toUpdate[field] = req.body[field];
    }
  });

  /***** Never trust users - validate input *****/
  if (!mongoose.Types.ObjectId.isValid(noteId)) {
    const err = new Error('The `id` is not valid');
    err.status = 400;
    return next(err);
  }

  if (toUpdate.title === '') {
    const err = new Error('Missing `title` in request body');
    err.status = 400;
    return next(err);
  }

  if (
    toUpdate.folderId &&
    !mongoose.Types.ObjectId.isValid(toUpdate.folderId)
  ) {
    const err = new Error('The `folderId` is not valid');
    err.status = 400;
    return next(err);
  }

  if (toUpdate.tags) {
    const badIds = toUpdate.tags.filter(
      tag => !mongoose.Types.ObjectId.isValid(tag)
    );
    if (badIds.length) {
      const err = new Error('The `tags` array contains an invalid `id`');
      err.status = 400;
      return next(err);
    }
  }

  if (toUpdate.folderId === '') {
    delete toUpdate.folderId;
    toUpdate.$unset = { folderId: 1 };
  }
  Note.findOneAndUpdate({ userId, _id: noteId }, toUpdate, { new: true })
    .then(result => {
      if (result) {
        res.json(result);
      } else {
        next();
      }
    })
    .catch(err => {
      next(err);
    });
});

/* ========== DELETE/REMOVE A SINGLE ITEM ========== */
router.delete('/:id', (req, res, next) => {
  const { id } = req.params;
  const userId = req.user.id;

  /***** Never trust users - validate input *****/
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const err = new Error('The `id` is not valid');
    err.status = 400;
    return next(err);
  }

  Note.findOneAndRemove({ _id: id, userId })
    .then(() => {
      res.sendStatus(204);
    })
    .catch(err => {
      next(err);
    });
});

module.exports = router;
