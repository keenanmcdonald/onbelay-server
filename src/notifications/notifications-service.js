const NotificationsService = {
    async createNotification(db, user_id, subject_id, type){
        console.log('create notification: ', user_id, subject_id, type)
        return db('notifications')
            .insert({user_id, subject_id, type})
            .returning('*')
    },
    getUnseenNotifications(db, user_id){
        return db('notifications')
            .where({user_id})
            .andWhereNot({seen: true})
    },
    markAsSeen(db, id){
        return db('notifications')
            .where({id})
            .update({seen: true})
            .returning('*')
    }
}

module.exports = NotificationsService