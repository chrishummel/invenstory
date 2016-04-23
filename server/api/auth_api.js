var express = require('express')
var passport = require('passport')
var JWT = require('jsonwebtoken')
var AmazonStrategy = require('passport-amazon').Strategy
var amazonAuth_config = require('../modules/config.js').amazonAuth
var jwt_config = require('../modules/config.js').jwtConfig
var db = require('knex')
var log = require('../modules/utilities.js').log;

passport.use(new AmazonStrategy({
    clientID: amazonAuth_config.clientId,
    clientSecret: amazonAuth_config.clientSecret,
    callbackURL: amazonAuth_config.callbackURL
  },
  function(accessToken, refreshToken, profile, done) {
    var userObj = {
      amazon_id: profile.id,
      username: profile.displayName,
      email: profile.emails[0].value,
      zipcode: profile._json.postal_code,
      amazon_accesToken: 'accessToken',
      amazon_refreshToken: 'refreshToken'
    }
    return done(null, userObj)
  }
))

function serialize(req, res, next) {
  next()
}

function generateToken(req, res, next) {
  //console.log('generate token ', req.user)
  req.token = JWT.sign({
      user: req.user
    }, jwt_config.secret, {
      expiresIn: 3600
    })

  next()
}

var router = express.Router()



.use(passport.initialize())
//.use()
/**
 * @apiDefine restricted Restricted content
 *  Restricts access to authorized users.
 * @apiHeader (auth) {String} Authorization PassesJWT to auth header
 * @apiError (401 Unauthorized) err User not authenticated.
 */

 /**
  * @apiDefine public Public endpoints
  *  Endpoint may be accessed without credentials.
  */

/**
 * @api {get}  /auth/amazon Login
 * @apiName authAmazon
 * @apiGroup Auth
 * @apiDescription Endpoint to initiate Amazon authentication.
 * @apiUse public
 */

.get('/amazon', passport.authenticate('amazon', { scope: ['profile', 'postal_code'] , session: false}))


/**
 * @api {get} /auth/amazon/callback Amazon Oauth Callback
 * @apiName AmazonOauthCallback
 * @apiGroup Auth
 * @apiDescription Endpoint to initiate Amazon authentication. NOT SURE THIS IS RIGHT.
 * @apiUse public
 * @apiPermission none
 *
 * @apiSuccess (200) {Object} jwt Serialized JWT
 *
 */

.get('/amazon/callback', 
  passport.authenticate('amazon', {session: false}),  
  serialize, 
  generateToken, 
  function(req,res){
    console.log('in here')

    res.json({user:req.user, token: req.token})
})



module.exports = router ;
 
 /**
  * @api {get} /logout Logout
  * @apiName Logout
  * @apiGroup Auth
  * @apiUse restricted
  * @apiPermission user
  *
  * @apiDescription Endpoint to cause user's credentials to expire.
  */
