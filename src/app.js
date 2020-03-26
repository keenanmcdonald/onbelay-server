require('dotenv').config()
const express = require('express')
const morgan = require('morgan')
const cors = require('cors')
const helmet = require('helmet')
const { NODE_ENV } = require('./config')
const authRouter = require('./auth/auth-router')
const usersRouter = require('./users/users-router')
const partnersRouter = require('./partners/partners-router')
const {cloudinaryConfig} = require('./cloud-config')

const app = express()

const morganOption = (NODE_ENV === 'production')
    ? 'tiny'
    : 'common';


app.use(morgan(morganOption))
app.use(helmet())
app.use(cors())

app.use('/auth', authRouter)

app.use('/users', usersRouter)

app.use('/partners', partnersRouter)


app.use(function errorHandler(error, req, res, next) {
    //handler to send error message and status code so that all errors that go to the front end go through the handler
    let response
    if (NODE_ENV === 'production'){
        response = {error: 'server error'}
    } else {
        console.error(error)
        response = {error: error.message}
    }
    res.status(500).send(response)
})

module.exports = app
