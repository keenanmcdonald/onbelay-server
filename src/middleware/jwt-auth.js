const AuthService = require('../auth/auth-service')
const UsersService = require('../users/users-service')

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

        UsersService.getUserByEmail(req.app.get('db'), payload.sub)
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

//used when authorization requires that the jwt payload matches the user id in the parameters. e.g. updating user information
function requireUserAuth(req, res, next){
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

        if (payload.user_id === parseInt(req.params.user_id)){
            next()
        }
        else{
            res.status(401).json({error: 'incorrect credentials, user is not authorized to access this data'})
        }
    

    } catch(error) {
        console.log(error)
        res.status(401).json({error: error})
    }
}

module.exports = {requireAuth,requireUserAuth}

