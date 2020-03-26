const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const config = require('../config')

const AuthService = {
    comparePasswords(password, hash) {
        return bcrypt.compare(password, hash)
    },
    hashPassword(password){
        return bcrypt.hash(password, 12)
    },
    createJwt(subject, payload) {
        return jwt.sign(payload, config.JWT_SECRET, {
            subject,
            expiresIn: config.JWT_EXPIRY,
            algorithm: 'HS256',
        })
    },
    verifyJwt(token){
        return jwt.verify(token, config.JWT_SECRET, {
            algorithms: ['HS256'],
        })
    },
    tokenMatchesId(token, user_id){
        return jwt.verify(token, config.JWT_SECRET, {
            algorithms: ['HS256'],
        })
            .then(payload => {
                if (payload.id === user_id){
                    return true
                }
                else{
                    return false
                }
            })
    },
}

module.exports = AuthService