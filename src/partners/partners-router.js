const express = require('express')
const PartnersService = require('./partners-service')
const UsersService = require('../users/users-service')
const {requireAuth} = require('../middleware/jwt-auth')

const partnersRouter = express.Router()
const jsonBodyParser = express.json()

partnersRouter
    .route('/:user_id')
    .get(requireAuth, (req, res, next) => {
        const {user_id} = req.params
        PartnersService.getPartners(req.app.get('db'), user_id)
            .then(partners => {
                partners = partners.map(partner => UsersService.serializeUser(partner))
                res.status(201).send(partners)
            })
            .catch(next)
    })

partnersRouter
    .route('/is_partner/:id1/:id2')
    .get(requireAuth, (req, res, next) => {
        const {id1, id2} = req.params
        PartnersService.isPartner(req.app.get('db'), id1, id2)
            .then(isPartner => {
                res.status(200).send(isPartner)
            })
            .catch(next)
    })

partnersRouter
    .route('/request')
    .post(requireAuth, jsonBodyParser, (req, res, next) => {
        const {user_id, requested_id} = req.body
        PartnersService.addPartnerRequest(req.app.get('db'), user_id, requested_id)
            .then(isPartner => {
                res.status(201).send(isPartner)
            })
            .catch(next)
    })

partnersRouter
    .route('/request/:user_id/:requested_id')
    .get(requireAuth, (req, res, next) => {
        const {user_id, requested_id} = req.params
        PartnersService.checkPartnerRequest(req.app.get('db'), user_id, requested_id)
            .then(hasRequested => {
                res.status(200).send(hasRequested)
            })
            .catch(next)

    })

module.exports = partnersRouter
