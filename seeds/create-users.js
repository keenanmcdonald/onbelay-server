const faker = require('faker')
const randomLocation = require('random-location')
const {STYLES, GRADES} = require('../src/config')
const UserService = require('../src/users/users-service')
//const AuthService = require('../src/auth/auth-service')



const PHOTO_URLS = [
    'https://res.cloudinary.com/obcloud/image/upload/v1582155740/onbelay/profilephoto8_cavshx.jpg',
    'https://res.cloudinary.com/obcloud/image/upload/v1582155740/onbelay/profilephoto7_vfdp34.jpg',
    'https://res.cloudinary.com/obcloud/image/upload/v1582155739/onbelay/profilephoto1_lmsv7a.jpg',
    'https://res.cloudinary.com/obcloud/image/upload/v1582155739/onbelay/profilephoto5_myo3hd.jpg',
    'https://res.cloudinary.com/obcloud/image/upload/v1582155739/onbelay/profilephoto6_vqxbkq.jpg',
    'https://res.cloudinary.com/obcloud/image/upload/v1582155739/onbelay/profilephoto3_askaeu.jpg',
    'https://res.cloudinary.com/obcloud/image/upload/v1582155739/onbelay/profilephoto2_pxrlox.jpg',
    'https://res.cloudinary.com/obcloud/image/upload/v1582155739/onbelay/profilephoto4_l4h5p6.jpg',
]
/*
function randomStyles(){
    const randomStyles = []
    for (style of STYLES){
        if (Boolean(Math.round(Math.random()))){
            randomStyles.push(style)
        }
    }
    if (randomStyles.length === 0){
        randomStyles.push('sport')
    }
    return randomStyles
}*/

function randomMinMaxGrade(){
    const multiplier = GRADES.length - 1
    const grade1 = Math.floor(Math.random() * multiplier)
    const grade2 = Math.floor(Math.random() * multiplier)
    const randomGrades = {}
    if (grade1 < grade2){
        randomGrades.min_grade = grade1
        randomGrades.max_grade = grade2
    }
    else{
        randomGrades.min_grade = grade2
        randomGrades.max_grade = grade1
    }
    return randomGrades
}

function randomPhotoUrl(){
    const index = Math.floor(Math.random() * 8)
    return PHOTO_URLS[index]
}

//generates a random location across US - I could find a better method that would get the random lat lng of a random US city...
function generateRandomLocation(){
    const randomLoc = randomLocation.randomCirclePoint({latitude: 30.2672, longitude: -97.7431}, 400000) //radius is ~ 250 miles in meters
    const randomLatLng = {}
    randomLatLng.lat = randomLoc.latitude
    randomLatLng.lng = randomLoc.longitude
    
    return randomLatLng
}

function formatLocation(location){
    return `${location.lat}, ${location.lng}`
}

function createFakeUser(db) {
    const randomGrades = randomMinMaxGrade()
    const location = generateRandomLocation()

    return {
        email: faker.internet.email(),
        password: faker.internet.password(),
        name: faker.name.firstName(),
        photo_url: randomPhotoUrl(),
        bio: faker.lorem.sentence(),  
        sport: (Math.random > .5),
        trad: (Math.random > .5),
        min_grade: randomGrades.min_grade,
        max_grade: randomGrades.max_grade,
        address: faker.address.city(),
        location_srid: UserService.makeSRIDFromLatLng(db, location.lat, location.lng),
        latitude: location.lat,
        longitude: location.lng,
        radius: Math.floor(Math.random() * 321869) //max radius is 200 miles in meters
    }
}

function createFakeUsers(db, numberOfUsers){
    const fakeUsers = []
    for (let i = 0; i < numberOfUsers; i++){
        fakeUsers.push(createFakeUser(db))
    }
    console.log(fakeUsers)
    return fakeUsers
}

module.exports = {createFakeUsers}
