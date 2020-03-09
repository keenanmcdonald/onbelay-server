const xss = require('xss')
const knexPostgis = require('knex-postgis');
const {GRADES} = require('../config')
const PartnersService = require('../partners/partners-service')

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
    makeSRIDFromLatLng(db, lat, lng){
        const st = knexPostgis(db)

        return st.setSRID(st.makePoint(lng, lat), 4326)
    },
    getDistanceInMiles(db, id1, id2){
        const st = knexPostgis(db)
        return db
            .raw(`
                SELECT ST_DistanceSphere(a.locationSRID, b.locationSRID)
                FROM users a, users b
                WHERE a.id=${id1} AND b.id=${id2};
            `)
            .then(result => {
                const distanceInMeters = result.rows[0].st_distancesphere
                const distanceInMiles = Math.floor(distanceInMeters / 1609.344)
                return distanceInMiles
            })
    },
    getMatching(db, id){
        return this.getUserById(db, id) 
            .then(user => {
                const {radius, max_grade, min_grade, sport, trad, latitude, longitude} = user
                const st = knexPostgis(db)
                console.log(max_grade)
                
                return PartnersService.getPartners(db, id)
                    .then(partners => {
                        const partnerIds = partners.map(partner => partner.id)
                        return db('users')
                            .select('*')
                            .where(st.dwithin('location_srid', st.geography(st.makePoint(longitude, latitude)), radius))
                            .andWhere(st.dwithin('location_srid', st.geography(st.makePoint(longitude, latitude)), 'radius'))
                            .andWhere('min_grade', '<=', max_grade)
                            .andWhere('max_grade', '>=', min_grade)
                            .andWhereNot({id})
                            .whereNotIn('id', partnerIds)
                            .andWhere(function() {
                                if (sport && trad){
                                    this.where('sport', true).orWhere('trad', true)
                                }
                                else if (sport){
                                    this.where('sport', true)                            
                                }
                                else if (trad){
                                    this.where('trad', true)                            
                                }
                            })

                    })

                })
    },
    hasSeen(db, user_id, seen_id){
        return db('seen')
            .select('*')
            .where({user_id, seen_id})
            .first()
            .then(res => {
                return !!res
            })
    },
    createSeen(db, user_id, seen_id){
        return db
            .insert({user_id, seen_id})
            .into('seen')
            .returning('*')
    },
    getSeen(db, user_id){
        return db('seen')
            .select('seen_id')
            .where({user_id})
            .then(ids => {
                return ids.map(obj => obj.seen_id)
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
            sport: user.sport ? user.sport : '',
            trad: user.trad ? user.trad : '',
            min_grade: GRADES[user.min_grade],
            max_grade: GRADES[user.max_grade],
            radius: Math.round(user.radius / 1609.344),
            date_created: new Date(user.date_created)
        }
    },
    //formatUser is called when formatting user data taken straight from front-end
    formatUser(db, user){
        console.log(user)
        if (user.latitude && user.longitude){
            user.location_srid = this.makeSRIDFromLatLng(db, user.latitude, user.longitude)
        }
        if (GRADES.includes(user.min_grade) && GRADES.includes(user.max_grade)){
            user.min_grade = GRADES.indexOf(user.min_grade)
            user.max_grade = GRADES.indexOf(user.max_grade)
        }
        if (user.radius){
            user.radius = Math.round(user.radius * 1609.34) //converts radius in miles to meters
        }
        return user
    }
}

module.exports = UserService