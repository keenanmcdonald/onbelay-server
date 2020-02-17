const express = require('express')
const UsersService = require('./users-service')
const AuthService = require('../auth/auth-service')
const {requireAuth} = require('../middleware/jwt-auth')
const cloudinary = require('cloudinary')
const {cloudParser} = require('../cloud-config')

const usersRouter = express.Router()
const jsonBodyParser = express.json()

usersRouter
    .route('/')
    .get(requireAuth, (req, res, next) => {
        UsersService.getAllUsers(req.app.get('db'))
            .then(users => {
                serializedUsers = users.map(user =>{
                    return UsersService.serializeUser(user)
                })
                res.json(serializedUsers)
            })
            .catch(next)
    })
    .post(jsonBodyParser, (req, res, next) => { //post on '/' is only used to create an account, thus only accepts email and password in body
        let {email, password} = req.body

        email = email.toLowerCase()

        for (const field of ['email', 'password']) {
            if (!req.body[field]){
                return res.status(400).json({
                    error: `Missing '${field}' in request body`
                })
            }
        }

        const passwordError = UsersService.validatePassword(password)

        if (passwordError){
            return res.status(400).json({error: passwordError})
        }

        return UsersService.hasUserWithEmail(req.app.get('db'), email)
            .then(hasUser => {
                if (hasUser) {
                    return res.status(400).json({error: 'There is already an account associated with this email address'})
                }

                return AuthService.hashPassword(password)
                    .then(hashedPassword => {
                        const newUser = {
                            email,
                            password: hashedPassword,
                        }

                        return UsersService.insertUser(req.app.get('db'), newUser)
                            .then(user => {
                                return res.status(201).end()
                            })
                            .catch(next)
                    })
            })
            .catch(next)
    })

//updating information for a specific user
usersRouter
    .route('/:user_id')
    .post(cloudParser.single('photo'), (req, res, next) => {
        console.log(req)

        /*
        //is there a simpler way to write this? I want to make sure I don't pick up any random fields that might be in the body... maybe that doesn't matter

        const {name, photo, bio, styles, min_grade, max_grade, location, radius} = req.body
        user = {id: req.params.user_id, name, photo, bio, styles, min_grade, max_grade, location, radius}

        for (const field of ['name', 'styles', 'min_grade', 'max_grade', 'location', 'radius']) { //only includes required fields
            if (!user[field]){
                return res.status(400).json({
                    error: `Missing '${field}' in request body`
                })
            }
        }
        */

    })

//uploads a photo to cloudinary, and places the image url and id in user's row

usersRouter
    .route('/:user_id/photo')
    .post(cloudParser.single('photo'), (req, res, next) => {
        console.log(req)
        console.log(req.file) // to see what is returned to you
        const user = {}
        user.id = req.params.user_id
        user.photo_url = req.file.url
        user.photo_id = req.file.public_id
        UsersService.updateUser(user)
    })

module.exports = usersRouter
