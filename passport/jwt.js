'use strict';

const { Strategy: JwtStrategy, ExtractJwt } = require('passport-jwt');

const { JWT_SECRET } = require('../config');

const options = {
  secretOrKey: JWT_SECRET,
  jwtFromRequest: ExtractJwt.fromAuthHeaderWithScheme('Bearer'),
  algorithms: ['HS256']
};
// console.log(options);
const jwtStrategy = new JwtStrategy(options, (payload, done) => {
  done(null, payload.user);
});

module.exports = jwtStrategy;
