# onBelay API
This is the back end server for onBelay - a partner finder app for climbers that let's them connect with other climbers in their area.

## onBelay Repo
https://github.com/keenanmcdonald/onbelay-app

## onBelay Live App
https://onbelayapp.com

## Endpoints

### /users/
#### /
GET: Information on all users (requires authentication)
POST: Create new account with email / password
#### /:userid
GET: Information on a specific user
POST: Profile information (i.e. name, bio, etc.)
#### /:userid/photo
POST: Profile photo
#### /:userid/matches
GET: All climbers that 'match' user's specifications (i.e. location / radius, minimum grade)
#### /:user_id/blocked/:blocked_id
GET: Sends boolean whether user of user_id has blocked user of blocked_id
POST: User of user_id blocks user of blocked_id

### /partners/
#### /:user_id
GET: All partners of a particular user
#### /is_partner/:id1/:id2
GET: Sends boolean whether users of id1 and id2 are partners
#### /request
POST: Make partner request from user_id to requested_id (sent in body as JSON)
#### /request/:user_id/:requested_id
GET: Sends boolean whether user_id has requested requested_id to be partners

