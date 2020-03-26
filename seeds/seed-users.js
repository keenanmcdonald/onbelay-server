const {DATABASE_URL} = require('../src/config')
const {createFakeUsers} = require('./create-users')
const knex = require('knex')

const db = knex({
  client: 'pg',
  connection: DATABASE_URL,
})

function seedUsers(db, users) {
  const fakeUsers = createFakeUsers(db, users)
  return db('users').insert(fakeUsers)
    .then(res => {
      return res
    })
}

seedUsers(db, 100)
