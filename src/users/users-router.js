const express = require('express')
const UsersService = require('./users-service')
const AuthService = require('../auth/auth-service')
const {requireAuth, requireUserAuth} = require('../middleware/jwt-auth')
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
    .get(requireAuth, (req, res, next) => {
        UsersService.getUserById(req.app.get('db'), req.params.user_id)
            .then(user => {
                user = UsersService.serializeUser(user)
                return res.status(201).json(user)
            })
            .catch(next)
    })
    .post(requireUserAuth, jsonBodyParser, (req, res, next) => {
        
        const user = UsersService.formatUser(req.app.get('db'), req.body)

        UsersService.updateUser(req.app.get('db'), user, req.params.user_id)
            .then(user => {
                const serializedUser = UsersService.serializeUser(user[0]) 
                return res.status(201).json(serializedUser)
            })
            .catch(next)
    })
    
usersRouter
    .route('/:id1/distance_from/:id2')
    .get(requireAuth, (req, res, next) => {
        const {id1, id2} = req.params
            UsersService.getDistanceInMiles(req.app.get('db'), id1, id2)
                .then(distance => {
                    res.status(200).json(distance)
                })
                .catch(next)
    })


//uploads a photo to cloudinary, and places the image url and id in the database
usersRouter
    .route('/:user_id/photo')
    .post(requireUserAuth, cloudParser.single('photo'), (req, res, next) => {
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
    .route('/:user_id/matches')
    .get(requireUserAuth, (req, res, next) => {
        UsersService.getMatching(req.app.get('db'), req.params.user_id)
            .then(matchingUsers => {
                const serializedUsers = []
                for (user of matchingUsers){
                    serializedUsers.push(UsersService.serializeUser(user))
                }
                res.status(200).send(serializedUsers)
            })
            .catch(next)
    })

usersRouter
    .route('/:user_id/has_seen/:seen_id')
    .get(requireAuth, (req, res, next) => {
        const {user_id, seen_id} = req.params
        UsersService.hasSeen(req.app.get('db'), user_id, seen_id)
            .then(hasSeen => {
                res.status(200).send(hasSeen)
            })
            .catch(next)
    })
    .post(requireUserAuth, (req, res, next) => {
        const {user_id, seen_id} = req.params

        UsersService.createSeen(req.app.get('db'), user_id, seen_id)
            .then((hasSeen) => {
                res.status(201).end()
            })
            .catch(next)

    })

usersRouter
    .route('/:user_id/has_seen')
    .get(requireAuth, (req, res, next) => {
        const {user_id} = req.params
        UsersService.getSeen(req.app.get('db'), user_id)
            .then(seen => {
                res.status(200).send(seen)
            })
            .catch(next)
    })

usersRouter
    .route('/:user_id/rejects/:reject_id')
    .get(requireAuth, (req, res, next) => {
        const {user_id, reject_id} = req.params
        UsersService.didReject(req.app.get('db'), user_id, reject_id)
            .then(didReject => {
                res.status(200).json(didReject)
            })
            .catch(next)
    })
    .post(requireUserAuth, (req, res, next) => {
        const {user_id, reject_id} = req.params
        UsersService.createReject(req.app.get('db'), user_id, reject_id)
            .then(() => {
                res.status(201).end()
            })
            .catch(next)
    })

module.exports = usersRouter
