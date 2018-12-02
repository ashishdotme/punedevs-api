const express = require('express');
const router = express.Router();
const gravatar = require('gravatar'); 
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const keys = require('../../config/keys')
const passport = require('passport');
const User = require('../../models/User');

router.get('/test', (req, res) => res.json({success: "hi"}));

router.post('/register', (req, res) => {
  User.findOne({ email: req.body.email })
    .then(user => {
      if(user){
        return res.status(400).json({sucess: false, message: "Email already exists"});
      } else {
        const avatar = gravatar.url(req.body.email, {
          s: '200',
          r: 'pg',
          d: 'mm'
        });
        const newUser = new User({
          name: req.body.name,
          email: req.body.email,
          avatar,
          password: req.body.password
        });
        bcrypt.genSalt(10, (err, salt) => {
           bcrypt.hash(newUser.password, salt, (err, hash) => {
             if(err) throw err;
             newUser.password = hash;
             newUser.save()
              .then(user => res.json({sucess:true,user}))
              .catch(err => console.log(err))
           })
        })
      }
    })
})

router.post('/login', (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  User.findOne({email})
    .then(user => {
      if(!user){
        return res.status(404).json({success: false, message: "User not found"});
      }

      bcrypt.compare(password, user.password)
        .then(isMatch => {
          if(isMatch){
            const payload = { id: user.id, name: user.name, avatar: user.avatar}
            // Sign token
            jwt.sign(
              payload, 
              keys.secret, 
              { expiresIn: 3600 }, 
              (err, token) => {
                res.json({
                  success: true,
                  token: 'Bearer ' + token
                })
            });
          } else {
            return res.status(400).json({success: false, message: 'Password incorrect'})
          }
        })
    })
})

router.get(
  '/current',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    res.json({
      id: req.user.id,
      name: req.user.name,
      email: req.user.email
    })
  }
)
module.exports = router;