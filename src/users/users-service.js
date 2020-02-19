const xss = require('xss')
const bcrypt = require('bcryptjs')

const REGEX_UPPER_LOWER_NUMBER = /(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])[\S]+/

const UserService = {
    getAllUsers(db) {
        return db
            .from('users')
    },
    getUserByEmail(db, email) {
        return db('users')
            .where({email})
            .first()
    },
    getUserById(db, id) { 
        return db
            .from('users')
            .select('*')
            .where({id})
            .first()
    },
    validatePassword(password){
        if (password.length < 8) {
            return 'Password must be longer than 8 characters'
        }
        if (password.length > 72) {
            return 'Password must be less than 72 characters'
        }
        if (password.startsWith(' ') || password.endsWith(' ')){
            return 'Password must not start or end with spaces'
        }
        if (!REGEX_UPPER_LOWER_NUMBER.test(password)) {
            return 'Password must contain at least one 1 upper case, lower case and number'
        }
        return null
    },
    hasUserWithEmail(db, email){
        return db('users')
            .where({email})
            .first()
            .then(user => !!user)
    },
    insertUser(db, newUser){
        return db
            .insert(newUser)
            .into('users')
            .returning('*') 
    },
    updateUser(db, user, id){
        return db('users')
            .update({...user})
            .where({id})
            .returning('*') 
    },
    serializeUser(user) {
        return {
            id: user.id,
            email: xss(user.email),
            name: user.name ? xss(user.name) : '',
            photo_url: user.photo_url ? xss(user.photo_url) : '',
            photo_id: user.photo_id ? xss(user.photo_id) : '',
            bio: user.bio ? xss(user.bio) : '',
            styles: user.styles ? xss(user.styles) : '',
            grade_min: user.min_grade ? xss(user.min_grade) : '',
            grade_max: user.min_grade ? xss(user.max_grade) : '',
            location: user.location ? user.location : '',
            date_created: new Date(user.date_created)
        }
    },
    formatUser(user){
        if (user.location){
            user.location = `${user.location.lat}, ${user.location.lng}`
        }
        return user
    }
}

module.exports = UserService