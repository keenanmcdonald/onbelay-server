const MessagesService = {
    sendMessage(db, from_id, to_id, content){
        console.log({from_id, to_id, content})
        return db
            .insert({from_id, to_id, content})
            .into('messages')
            .returning('*')
    },
    getMessages(db, id1, id2){
        return db('messages')
            .where({from_id: id1, to_id: id2})
            .orWhere({from_id: id2, to_id: id1})
    },
}

module.exports = MessagesService 