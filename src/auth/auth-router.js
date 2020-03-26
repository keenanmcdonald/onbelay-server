const express = require('express')
const AuthService = require('./auth-service')
const UsersService = require('../users/users-service')

const authRouter = express.Router()
const jsonBodyParser = express.json()

authRouter.post('/login', jsonBodyParser, (req, res, next) => {
    const {email, password} = req.body
    const loginUser = {email, password}

    for (const [key, value] of Object.entries(loginUser)){
        if (value == null){
            return res.status(400).json({error: `missing ${key} in request body`})
        }
    }

    UsersService.getUserByEmail(
        req.app.get('db'), loginUser.email.toLowerCase()
    )
        .then(dbUser => {
            if (!dbUser){
                return res.status(400).json({error: 'Incorrect username or password'})
            }
            return AuthService.comparePasswords(loginUser.password, dbUser.password)
                .then(compareMatch => {
                    if (!compareMatch){
                        return res.status(400).json({error: 'Incorrect username or password'})
                    }
                    const sub = dbUser.email
                    const payload = {user_id: dbUser.id}
                    userS = UsersService.serializeSelf(dbUser)
                    res
                    .status(200)
                    .send({
                        user: userS,
                        authToken: AuthService.createJwt(sub, payload)
                    })
                })
        })
        .catch(next)
})

//put token in header rather than body
authRouter.get('/verify_token', (req, res) => {
    const authToken = req.get('authorization') || ''

    let bearerToken;

    if (!authToken.toLowerCase().startsWith('bearer ')) {
        return res.status(401).json({error: 'Missing bearer token'})
    }
    else {
        bearerToken = authToken.slice(7, authToken.length)
    }

    try{
        const payload = AuthService.verifyJwt(bearerToken)

        UsersService.getUserByEmail(req.app.get('db'), payload.sub)
            .then(user => {
                if (!user){
                    return res.status(401).json({error: 'Unauthorized request'})
                }
                user = UsersService.serializeSelf(user)
                res.status(202).json(user)
            })
    } catch(error) {
        res.status(401).json({error: error})
    }
})

module.exports = authRouter