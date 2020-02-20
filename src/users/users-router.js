const express = require('express')
const UsersService = require('./users-service')
const AuthService = require('../auth/auth-service')
const {requireAuth} = require('../middleware/jwt-auth')
const { cloudParser } = require('../cloud-config')

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
                                return res.status(201).send(user)
                            })
                            .catch(next)
                    })
            })
            .catch(next)
    })

//updating information for a specific user
usersRouter
    .route('/:user_id')
    .get((req, res) => {
        UsersService.getUserById(req.app.get('db'), req.params.user_id)
            .then(user => {
                user = UsersService.serializeUser(user)
                return res.status(201).json(user)
            })
    })
    .post(jsonBodyParser, (req, res, next) => {
        // only certain fields into user but only if they appear in the body?        

        const user = UsersService.formatUser(req.body)

        UsersService.updateUser(req.app.get('db'), user, req.params.user_id)
            .then(user => {
                const serializedUser = UsersService.serializeUser(user[0]) 
                return res.status(201).json(serializedUser)
            })
            .catch(next)
    })

usersRouter
    .route('/:user_id/location')
    .get((req, res) => {
        UsersService.getLocation(req.app.get('db'), req.params.user_id)
            .then(location => {
                console.log(location)
                res.status(200).send(location)
            })
    })
    .post(jsonBodyParser, (req, res, next) => {

        const location = req.body

        UsersService.updateLocation(req.app.get('db'), location, req.params.user_id)
            .then(user => {
                const serializedUser = UsersService.serializeUser(user[0]) 
                return res.status(201).json(serializedUser)
            })
            .catch(next)
    })


//uploads a photo to cloudinary, and places the image url and id in the database
usersRouter
    .route('/:user_id/photo')
    .post(cloudParser.single('photo'), (req, res, next) => {
        //add overwrite existing photo in cloud service?
        const user = {}
        user_id = req.params.user_id
        user.photo_url = req.file.url
        user.photo_id = req.file.public_id
        
        
        UsersService.updateUser(req.app.get('db'), user, user_id)
            .then(user => {
                const serializedUser = UsersService.serializeUser(user[0]) 
                res.status(201).json(serializedUser)
            })
    })

usersRouter
    .route('/:user_id/matching')
    .get((req, res) => {
        UsersService.getMatching(req.app.get('db'), req.params.user_id)
            .then(matchingUsers => {
                console.log(matchingUsers)
                res.status(200).send(matchingUsers)
            })
    })

module.exports = usersRouter
