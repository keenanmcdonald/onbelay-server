const express = require('express')
const NotificationsService = require('./notifications-service')
const {requireUserAuth, requireAuth} = require('../middleware/jwt-auth')

const notificationsRouter = express.Router()

notificationsRouter
.route('/:user_id')
.get(requireUserAuth, (req, res) => {
    const user_id = req.params.user_id

    NotificationsService.getUnseenNotifications(req.app.get('db'), user_id)
        .then(notifications => {
            res.status(200).send(notifications)
        })
})

notificationsRouter
.route('/seen/:id')
.put(requireAuth, (req, res) => {
    console.log('mark as seen?')
    const id = req.params.id

    NotificationsService.markAsSeen(req.app.get('db'), id)
        .then((updatedNotification) => {
            res.status(200).send(updatedNotification)
        })
})

module.exports = notificationsRouter