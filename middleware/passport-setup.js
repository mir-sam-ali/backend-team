const passport = require('passport')
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const Public = require('../models/Public.model')
require('dotenv').config()

passport.use('google', new GoogleStrategy({
    clientID: process.env.CLIENTID,
    clientSecret: process.env.CLIENTSECRET,
    // use below one URL for development testing 
    // callbackURL: "http://localhost:5000/blog/auth/google/callback",
    callbackURL: "https://ancient-spire-21996.herokuapp.com/blog/auth/google/callback"
  },
  async function(accessToken, refreshToken, profile, done) {
    
    try{
      const user = await Public.findOne({googleId: profile.emails[0].value})

      if(!user){

        try{
          const user = new Public({ googleId: profile.emails[0].value, token: accessToken})
          await user.save()
          return done(null,user)
        }catch(err){
          throw err
        }
        
      }else{
        return done(null,user)
      }
      

    }catch(err){
      return done(err)
    }
    
  }
));

passport.use('google-alt', new GoogleStrategy({
  clientID: process.env.CLIENTID,
  clientSecret: process.env.CLIENTSECRET,
  // callbackURL: "http://localhost:5000/projects/auth/google/callback",
  callbackURL: "https://ancient-spire-21996.herokuapp.com/projects/auth/google/callback"
},
  async function(accessToken, refreshToken, profile, done) {
    
    try{
      const user = await Public.findOne({googleId: profile.emails[0].value})

      if(!user){

        try{
          const user = new Public({ googleId: profile.emails[0].value, token: accessToken})
          await user.save()
          return done(null,user)
        }catch(err){
          throw err
        }
        
      }else{
        return done(null,user)
      }
      

    }catch(err){
      return done(err)
    }
    
  }
));

passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(user, done) {
  done(null, user);
}); 