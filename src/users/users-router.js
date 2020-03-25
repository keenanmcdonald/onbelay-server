const express = require('express')
const UsersService = require('./users-service')
const AuthService = require('../auth/auth-service')
const {requireAuth, requireUserAuth, requirePartnerAuth} = require('../middleware/jwt-auth')
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
                const serializedUser = UsersService.serializeSelf(user[0]) 
                return res.status(201).json(serializedUser)
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
                const serializedUser = UsersService.serializeSelf(user[0]) 
                res.status(201).json(serializedUser)
            })
    })
usersRouter
    .route('/:user_id/contact')
    .get(requirePartnerAuth, (req, res, next) => {
        const {user_id} = req.params
        UsersService.getUserContact(req.app.get('db'), user_id)
            .then(contact => {
                const serializedContact = UsersService.serializeContact(contact)
                res.status(200).send(serializedContact)
            })
    })
usersRouter
    .route('/:user_id/matches')
    .get(requireUserAuth, (req, res, next) => {
        const {user_id} = req.params
        UsersService.getMatching(req.app.get('db'), req.params.user_id)
            .then(matchingUsers => {
                UsersService.sortMatches(req.app.get('db'), user_id, matchingUsers)
                    .then(sortedUsers => {
                        const serializedUsers = []
                        for (user of sortedUsers){
                            serializedUsers.push(UsersService.serializeUser(user))
                        }
                        res.status(200).json(serializedUsers)
                    })
            })
            .catch(next)
    })
    usersRouter
    .route('/:user_id/blocked/:blocked_id')
    .get(requireAuth, (req, res, next) => {
        const {user_id, blocked_id} = req.params
        UsersService.didBlock(req.app.get('db'), user_id, blocked_id)
            .then(didBlock => {
                res.status(200).json(didBlock)
            })
            .catch(next)
    })
    .post(requireUserAuth, (req, res, next) => {
        const {user_id, blocked_id} = req.params
        UsersService.createBlock(req.app.get('db'), user_id, blocked_id)
            .then(() => {
                res.status(201).end()
            })
            .catch(next)
    })
/*
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
*/

module.exports = usersRouter
