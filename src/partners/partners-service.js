const xss = require('xss')
const {GRADES} = require('../config')


const PartnersService = {
    getPartners(db, user_id){
        return db('partners')
            .select('id')
            .where('id', 'like', `${user_id}-%`)
            .orWhere('id', 'like', `%-${user_id}`)
            .then(joinedIds => {
                return db('blocked')
                    .select('*')
                    .where({user_id})
                    .orWhere({blocked_id: user_id})
                    .then(blockedRows => {
                        const blockedIds = blockedRows.map(row => {
                            if (row.user_id == user_id){
                                return row.blocked_id
                            }
                            else {
                                return row.user_id
                            }
                        })
                        let partnerIds = []
                        for (let joinedId of joinedIds){
                            partnerIds.push(this.findOtherFromJoinedId(user_id, joinedId.id))
                        }
                        return db('users')
                            .select('*')
                            .whereIn('id', partnerIds)
                            .whereNotIn('id', blockedIds)        
                    })
            })
    },
    getAllRequests(db, user_id){
        return db('requests')
            .select('requested_id')
            .where({user_id})
    },
    isPartner(db, id1, id2){
        const id = this.joinIds(id1, id2)
        return db('partners')
            .select('*')
            //.where({id})
            .then(partnerId => {
                return !!partnerId.length
            })
    },
    checkPartnerRequest(db, user_id, requested_id){
        return db('requests')
            .where({user_id, requested_id})
            .first()
            .then(request => {
                return !!request
            })
    },
    addPartnerRequest(db, user_id, requested_id){
        return db
            .insert({user_id, requested_id})
            .into('requests')
            .returning('*')
            .then(() => {
                return this.checkPartnerRequest(db, requested_id, user_id)
                    .then(isPartner => {
                        if (isPartner){
                            return this.createPartnership(db, user_id, requested_id)
                                .then(id => {
                                    return !!id
                                })
                        }
                        else{
                            return false
                        }
                    })
            })
    },
    createPartnership(db, id1, id2){
        return db
            .insert({id: this.joinIds(id1,id2)})
            .into('partners')
            .returning('*')
    },
    joinIds(id1, id2){
        id1 = parseInt(id1)
        id2 = parseInt(id2)
        if (id1 < id2){
            return id1 + '-' + id2
        }
        else if (id2 < id1){
            return id2 + '-' + id1
        }
        else{
            return null
        }
    },
    findOtherFromJoinedId(user_id, joinedId){
        const ids = joinedId.split('-').map(id => parseInt(id))

        if (parseInt(user_id) === ids[0]){
            return parseInt(ids[1])
        }
        else if (parseInt(user_id) === ids[1]){
            return parseInt(ids[0])
        }
        else{
            return null
        } 
    },
    serializePartner(user){
        return {
            id: user.id,
            name: user.name ? xss(user.name) : '',
            photo_url: user.photo_url ? xss(user.photo_url) : '',
            bio: user.bio ? xss(user.bio) : '',
            sport: user.sport ? user.sport : '',
            trad: user.trad ? user.trad : '',
            min_grade: GRADES[user.min_grade],
            max_grade: GRADES[user.max_grade],
            date_created: new Date(user.date_created),
            phone: xss(user.phone),
        }

    }
}

module.exports = PartnersService