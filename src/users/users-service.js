const xss = require('xss')
const knexPostgis = require('knex-postgis');
const {GRADES} = require('../config')
const PartnersService = require('../partners/partners-service')
const NodeCache = require('node-cache')

const REGEX_UPPER_LOWER_NUMBER = /(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])[\S]+/

const ttl = 15 * 60 * 1 //15 minutes


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
    getUserContact(db, id){
        return db('users')
            .select('phone', 'contact_email', 'contact_preferred')
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
    makeSRIDFromLatLng(db, lat, lng){
        const st = knexPostgis(db)

        return st.setSRID(st.makePoint(lng, lat), 4326)
    },
    getDistanceInMiles(db, id1, id2){
        const st = knexPostgis(db)
        return db
            .raw(`
                SELECT ST_DistanceSphere(a.location_srid, b.location_srid)
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
                const {radius, redpoint_sport, redpoint_trad, min_grade_sport, min_grade_trad, sport, trad, latitude, longitude} = user
                const st = knexPostgis(db)
                
                return PartnersService.getPartners(db, id)
                    .then(partners => {
                        const partnerIds = partners.map(partner => partner.id)
                        return this.getBlocked(db, id)
                            .then(blocked => {
                                const blockedIds = blocked.map(blocked_user => blocked_user.blocked_id)
                                return db('users')
                                    .select('*')
                                    .where(st.dwithin('location_srid', st.geography(st.makePoint(longitude, latitude)), radius))
                                    .andWhere(st.dwithin('location_srid', st.geography(st.makePoint(longitude, latitude)), 'radius'))
                                    .andWhereNot({id})
                                    .whereNotIn('id', partnerIds)
                                    .whereNotIn('id', blockedIds)
                                    .andWhere(function() {
                                        if (sport && trad){
                                            this
                                            .where('sport', true).andWhere('min_grade_sport', '<=', redpoint_sport).andWhere('redpoint_sport', '>=', min_grade_sport)
                                            .orWhere('trad', true).andWhere('min_grade_trad', '<=', redpoint_trad).andWhere('redpoint_trad', '>=', min_grade_trad)
                                        }
                                        else if (sport){
                                            this.where('sport', true).andWhere('min_grade_sport', '<=', redpoint_sport).andWhere('redpoint_sport', '>=', min_grade_sport)                       
                                        }
                                        else if (trad){
                                            this.where('trad', true).andWhere('min_grade_trad', '<=', redpoint_trad).andWhere('redpoint_trad', '>=', min_grade_trad)
                                        }
                                        else{
                                            this.where('sport', false).andWhere('trad', false)
                                        }
                                    })
                            })
                    })

                })
    },
    sortMatches(db, user_id, matches){
        return this.getUserById(db, user_id)
            .then(user => {
                return PartnersService.getAllRequests(db, user_id)
                    .then(requests => {
                        requests = requests.map(request => request.requested_id)
                        for (match of matches){
                            match.score = 0
                            match.score -= 10 * Math.abs(match.max_grade - user.max_grade)
                            match.score += (user.sport && match.sport) ? 30 : 0
                            match.score += (user.trad && match.trad) ? 30 : 0
                            if (requests.includes(match.id)){
                                match.score -= 100
                            }
                        }
                        matches = matches.sort((a,b) => b.score - a.score)

                        return matches
                    })
            })
    },
    getAllSeen(db, user_id){
        return db('seen')
            .select('seen_id')
            .where({user_id})
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
    serializeSelf(user) {
        return {
            id: user.id,
            email: xss(user.email),
            name: user.name ? xss(user.name) : '',
            photo_url: user.photo_url ? xss(user.photo_url) : '',
            photo_id: user.photo_id ? xss(user.photo_id) : '',
            bio: user.bio ? xss(user.bio) : '',
            sport: user.sport ? user.sport : '',
            trad: user.trad ? user.trad : '',
            min_grade_sport: GRADES[user.min_grade_sport],
            min_grade_trad: GRADES[user.min_grade_trad],
            redpoint_sport: GRADES[user.redpoint_sport],
            redpoint_trad: GRADES[user.redpoint_trad],
            radius: Math.round(user.radius / 1609.344),
            date_created: new Date(user.date_created),
            address: xss(user.address),
            phone: xss(user.phone),
        }
    },
    serializeUser(user) {
        return {
            id: user.id,
            name: user.name ? xss(user.name) : '',
            photo_url: user.photo_url ? xss(user.photo_url) : '',
            bio: user.bio ? xss(user.bio) : '',
            sport: user.sport ? user.sport : '',
            trad: user.trad ? user.trad : '',
            min_grade_sport: GRADES[user.min_grade_sport],
            min_grade_trad: GRADES[user.min_grade_trad],
            redpoint_sport: GRADES[user.redpoint_sport],
            redpoint_trad: GRADES[user.redpoint_trad],
            date_created: new Date(user.date_created),
        }
    },
    serializeContact(contact) {
        return {
            phone: xss(contact.phone),
        }
    },
    //formatUser is called when formatting user data taken straight from front-end
    formatUser(db, user){
        if (user.latitude && user.longitude){
            user.location_srid = this.makeSRIDFromLatLng(db, user.latitude, user.longitude)
        }
        if (GRADES.includes(user.min_grade_sport) && GRADES.includes(user.redpoint_sport)){
            user.min_grade_sport = GRADES.indexOf(user.min_grade_sport)
            user.redpoint_sport = GRADES.indexOf(user.redpoint_sport)
        }
        if (GRADES.includes(user.min_grade_trad) && GRADES.includes(user.redpoint_trad)){
            user.min_grade_trad = GRADES.indexOf(user.min_grade_trad)
            user.redpoint_trad = GRADES.indexOf(user.redpoint_trad)
        }

        if (user.radius){
            user.radius = Math.round(user.radius * 1609.34) //converts radius in miles to meters
        }
        return user
    },
    didBlock(db, user_id, blocked_id){
        return db('blocked')
            .select('*')
            .where({user_id, blocked_id})
            .first()
            .then(row => {
                return !!row
            })
    },
    createBlock(db, user_id, blocked_id){
        return db('blocked')
            .insert({user_id, blocked_id})
            .into('blocked')
            .returning('*')
    },
    getBlocked(db, user_id){
        return db('blocked')
            .select('blocked_id')
            .where({user_id})
    }
}

module.exports = UserService