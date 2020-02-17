const AuthService = require('../auth/auth-service')

function requireAuth(req, res, next) {
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

        AuthService.getUserWithEmail(req.app.get('db'), payload.sub)
            .then(user => {
                if (!user){
                    return res.status(401).json({error: 'Unauthorized request'})
                }
                req.user = user
                next()
            })
            .catch(e => {
                next(e)
            })
    } catch(error) {
        console.log(error)
        res.status(401).json({error: error})
    }
}

module.exports = {requireAuth,}

