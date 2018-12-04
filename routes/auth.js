'use strict';
const express = require('express');
const mongoose = require('mongoose');
const User = require('../models/user');
const router = express.Router();

const passport = require('passport');

// const { Strategy: LocalStrategy } = require('passport-local');

const options = { session: false, failWithError: true }; //throws error, instead of sending text response, then middlewear formats error as json response?/instead of sending a response, it'll throw an error if theres a auth error - text body vs json body 

const localAuth = passport.authenticate('local', options);//this is going to use local auth (tomorrow will be jwt)

router.post('/login', localAuth, function(req, res) {
  return res.json(req.user);
});
// we pass in localAuth as a middleware fn that will check if the user can log in or not - if they cant, then the middlware handles it and it never gets into line 19. Otherwise, passes it back to us, including a req.user so we can now acccess that and know who's logged in. 
module.exports = router;
