const xss = require('xss')
const knexPostgis = require('knex-postgis');
const {GRADES} = require('../config')

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
        return db('users').select('*').where({id}).first()
            .then(user => {
                return this.getLocation(db, id)
                    .then(location => {
                        user.location = location
                        return user
                    })
            })
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
    updateLocation(db, location, id){
        return db('users')
            .update({location: this.makeSRIDFromLatLng(location)})
            .where({id})
            .returning('*')
    },
    makeSRIDFromLatLng(db, latLng){
        const st = knexPostgis(db)
        const latitude = parseInt(latLng.lat)
        const longitude = parseInt(latLng.lng)

        return st.setSRID(st.makePoint(latitude, longitude), 4326)
    },
    getLocation(db, id){
        const st = knexPostgis(db)

        return db('users')
            .select(st.x('location').as('lng'), st.y('location').as('lat'))
            .where({id})
            .first()
    },
    getMatching(db, id){
        return this.getUserById(db, id)
            .then(user => {
                const {radius, max_grade, min_grade, styles, location} = user

                const st = knexPostgis(db)
                
                //user also needs to be in other climbers' search radius

                return db('users')
                    .select('*')
                    .where(st.dwithin('location', st.geography(st.makePoint(location.lng, location.lat)), radius))
                    .andWhere('min_grade', '<=', max_grade)
                    .andWhere('max_grade', '>=', min_grade)
                    .andWhere('styles' && styles)

            })

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
            radius: user.radius ? parseInt(user.radius) : '',
            date_created: new Date(user.date_created)
        }
    },
    formatUser(user){
        if (user.location){
            user.location = `${user.location.lat}, ${user.location.lng}`
        }
        if (GRADES.includes(user.min_grade) && GRADES.includes(user.max_grade)){
            user.min_grade = GRADES.indexOf(user.min_grade)
            user.max_grade = GRADES.indexOf(user.max_grade)
        }
        return user
    }
}

module.exports = UserService