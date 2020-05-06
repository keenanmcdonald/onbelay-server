const express = require('express')
const MessagesService = require('./messages-service')
const UsersService = require('../users/users-service')

const messagesRouter = express.Router()
const jsonBodyParser = express.json()

messagesRouter
.route('/:from_id/:to_id')
.get(jsonBodyParser, (req, res) => {
    const {to_id, from_id} = req.params

    MessagesService.getMessages(req.app.get('db'), to_id, from_id)
        .then(messages => {
            res.status(200).send(messages)
        })
})
.post(jsonBodyParser, (req, res) => {
    console.log(req.body)
    const {content} = req.body
    console.log(content)
    const {to_id, from_id} = req.params

    if (!content){
        res.status(400).end()
    }

    MessagesService.sendMessage(req.app.get('db'), from_id, to_id, content)
        .then(() => {
            res.status(201).end()
        })
})

module.exports = messagesRouter