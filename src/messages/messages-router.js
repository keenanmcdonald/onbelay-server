const express = require('express')
const MessagesService = require('./messages-service')
const UsersService = require('../users/users-service')
const {requireUserAuth} = require('../middleware/jwt-auth')

const messagesRouter = express.Router()
const jsonBodyParser = express.json()

messagesRouter
.route('/:user_id/:to_id')
.get(requireUserAuth, jsonBodyParser, (req, res) => {
    const from_id = req.params.user_id
    const to_id = req.params.to_id

    MessagesService.getMessages(req.app.get('db'), to_id, from_id)
        .then(messages => {
            res.status(200).send(messages)
        })
})
.post(requireUserAuth, jsonBodyParser, (req, res) => {
    const {content} = req.body
    const from_id = req.params.user_id
    const to_id = req.params.to_id

    if (!content){
        res.status(400).end()
    }

    MessagesService.sendMessage(req.app.get('db'), from_id, to_id, content)
        .then(() => {
            res.status(201).end()
        })
})

module.exports = messagesRouter