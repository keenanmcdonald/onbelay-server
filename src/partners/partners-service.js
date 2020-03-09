const PartnersService = {
    getPartners(db, user_id){
        return db('partners')
            .select('id')
            .where('id', 'like', `${user_id}-%`)
            .orWhere('id', 'like', `%-${user_id}`)
            .then(joinedIds => {
                let partnerIds = []
                for (let joinedId of joinedIds){
                    partnerIds.push(this.findOtherFromJoinedId(user_id, joinedId.id))
                }
                return db('users')
                    .select('*')
                    .whereIn('id', partnerIds)
            })
    },
    isPartner(db, id1, id2){
        const id = this.joinIds(id1, id2)
        console.log('partners id', id)
        return db('partners')
            .select('*')
            .where({id})
            .then(partnerId => {
                console.log('returned partnerId: ', partnerId)
                return !!partnerId.length
            })
    },
    checkPartnerRequest(db, requester_id, requested_id){
        return db('partner_requests')
            .where({requester_id, requested_id})
            .first()
            .then(request => {
                return !!request
            })
    },
    addPartnerRequest(db, requester_id, requested_id){
        return db
            .insert({requester_id, requested_id})
            .into('partner_requests')
            .returning('*')
            .then(() => {
                return this.checkPartnerRequest(db, requested_id, requester_id)
                    .then(isPartner => {
                        if (isPartner){
                            return this.createPartnership(db, requester_id, requested_id)
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
    }
}

module.exports = PartnersService