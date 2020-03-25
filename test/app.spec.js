const app = require('../src/app')
const supertest = require('supertest')
const knex = require('knex')
const {TEST_DATABASE_URL} = require('../src/config')
const bcrypt = require('bcrypt')
const AuthService = require('../src/auth/auth-service')
const UsersService = require('../src/users/users-service')


let user1 = {
  email: 'user@onbelayapp.com',
  password: 'Climbing1',
  name: 'User',
  photo_url: 'photoUrl',
  photo_id: 'photoId',
  bio: 'bio',
  sport: true,
  trad: true,
  min_grade: '5.9',
  max_grade: '5.12-',
  latitude: 30.2672,
  longitude: -97.7431,
  address: 'Austin, TX, USA',
  radius: 100,
  phone: '555-555-5555'
}

describe('Users Endpoints', () => {
  let db
  let token

  before('make knex instance', () => {
    db = knex({
      client: 'pg', 
      connection: TEST_DATABASE_URL,
    })
    app.set('db', db)
  })

  before(('clear users'), () => db.raw('TRUNCATE TABLE users RESTART IDENTITY CASCADE'))

  /*
  before('format user1', () => {
    user1 = UsersService.formatUser(db, user1)
  })

  before('insert user1', async () => {
    return db
      .into('users')
      .insert({
        ...user1,
        password: await bcrypt.hash(user1.password, 12),
      })
  })

  before('get Token', done => {
    supertest(app)
      .post('/auth/login')
      .send({email: user1.email, password: user1.password})
      .then(res => {
        token = res.body.authToken
        done()
      })
  })*/

  after('disconnect from db', () => db.destroy())

  describe('insert and read users', () => {
      it('create account', async () => {
        return supertest(app)
          .post('/users')
          .send({email: user1.email, password: user1.password})
          .expect(201)
          .expect(res => {
            expect(res.body[0].email).to.eql(user1.email)
          })
      })

      it('get Token', done => {
        supertest(app)
          .post('/auth/login')
          .send({email: user1.email, password: user1.password})
          .then(res => {
            token = res.body.authToken
            console.log(token)
            done()
          })
      })

      it('post user information', () => {
        return supertest(app)
          .post('/users/1')
          .set('authorization', `bearer ${token}`)
          .send(user1)
          .expect(201)
      })

      it('get all users request', () => {
        return supertest(app)
          .get('/users')
          .set('authorization', `bearer ${token}`)
          .expect(200)
          .expect(res => {
            for (let i = 0; i < res.body; i++){
              expect(res.body[i].id).to.eql(1)
              expect(res.body[i].name).to.eql(user1.name)
              expect(res.body[i].bio).to.eql(user1.bio)
              expect(res.body[i].photo_url).to.eql(user1.photo_url)
              expect(res.body[i].sport).to.eql(user1.sport)
              expect(res.body[i].trad).to.eql(user1.trad)
              expect(res.body[i].min_grade).to.eql(user1.min_grade)
              expect(res.body[i].max_grade).to.eql(user1.max_grade)
            }
          })    
      })

      it('get specific user', () => {
        return supertest(app)
          .get('/users')
          .set('authorization', `bearer ${token}`)
          .expect(200)
          .expect(res => {
              expect(res.body[0].name).to.eql(user1.name)
              expect(res.body[0].bio).to.eql(user1.bio)
              expect(res.body[0].photo_url).to.eql(user1.photo_url)
              expect(res.body[0].sport).to.eql(user1.sport)
              expect(res.body[0].trad).to.eql(user1.trad)
              expect(res.body[0].min_grade).to.eql(user1.min_grade)
              expect(res.body[0].max_grade).to.eql(user1.max_grade)
          })
      })



  })



})