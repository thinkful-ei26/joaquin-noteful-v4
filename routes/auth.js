'use strict';
const express = require('express');
const mongoose = require('mongoose');
const User = require('../models/user');
const router = express.Router();
const jwt = require('jsonwebtoken');

const { JWT_SECRET, JWT_EXPIRY } = require('../config');


const passport = require('passport');
// Protect endpoints using JWT Strategy
// router.use('/', passport.authenticate('jwt', { session: false, failWithError: true }));

function createAuthToken(user) {
  return jwt.sign({ user }, JWT_SECRET, {
    subject: user.username,
    expiresIn: JWT_EXPIRY
  });
}
// const { Strategy: LocalStrategy } = require('passport-local');


const options = { session: false, failWithError: true }; //throws error, instead of sending text response, then middlewear formats error as json response?/instead of sending a response, it'll throw an error if theres a auth error - text body vs json body

const localAuth = passport.authenticate('local', options); //this is going to use local auth (tomorrow will be jwt)

router.post('/', localAuth, function(req, res) {
  const authToken = createAuthToken(req.user); //create a token on login and return it to the user. req.user contains password, but it's ok b/c the jwt.sign() method invokes the User Schema with removes the PW.
  res.json({ authToken });
});
// we pass in localAuth as a middleware fn that will check if the user can log in or not - if they cant, then the middlware handles it and it never gets into line 19. Otherwise, passes it back to us, including a req.user so we can now acccess that and know who's logged in.
module.exports = router;
