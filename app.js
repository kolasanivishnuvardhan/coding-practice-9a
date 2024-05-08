const express = require('express')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const path = require('path')
const bcrypt = require('bcrypt')
const app = express()
app.use(express.json())
// initialize db and server
const dbPath = path.join(__dirname, 'userData.db')
let db = null
const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server started!!')
    })
  } catch (e) {
    console.log(`ErROR : ${e.message}`)
    process.exit(1)
  }
}

initializeDbAndServer() //initialization completed

//api 1 Register
app.post('/register', async (request, response) => {
  const {username, name, password, gender, location} = request.body

  const hashedPassword = await bcrypt.hash(password, 10)
  const checkUsernameQuery = `
    select
        *
    from
        user
    where
        username = '${username}';
    `
  const checkUser = await db.get(checkUsernameQuery)
  if (checkUser === undefined) {
      if (password.length < 5) {
        response.status(400)
        response.send('Password is too short')
      }else{
        //create new user
        const createNewUserQery = `
        insert into user(username,name,password,gender,location)
        values('${username}','${name}','${hashedPassword}','${gender}','${location}');
        `
        await db.run(createNewUserQery)
        response.send('User created successfully')
}
  } else {
    //user alreday exits
    response.status(400)
    response.send('User already exists')
  }
}) //api 1 completed

// api 2 Login
app.post('/login', async (request, response) => {
  const {username, password} = request.body
  const checkUserInDBQuery = `
  select
    *
  from
    user
  where
    username = '${username}';
  `
  const user = await db.get(checkUserInDBQuery)
  if (user === undefined) {
    // invalid username or username not present
    response.status(400)
    response.send('Invalid user')
  } else {
    const checkPassword = await bcrypt.compare(password, user.password)
    if (checkPassword) {
      // login success
      response.send('Login success!')
    } else {
      // invalid password
      response.status(400)
      response.send('Invalid password')
    }
  }
}) // api 2 completed

// api 3 change password
app.put('/change-password', async (request, response) => {
  const {username, oldPassword, newPassword} = request.body
  const getUserDetailsQuery = `
  select
    *
  from
    user
  where
    username = '${username}';
  `
  const userDetails = await db.get(getUserDetailsQuery)
  const checkPassword = await bcrypt.compare(oldPassword, userDetails.password)
  const hashedPassword = await bcrypt.hash(newPassword, 10)

  if (checkPassword) {
    // update password with new password
    if (newPassword.length < 5) {
      // check newpassword is meeting the requirements
      response.status(400)
      response.send('Password is too short')
    } else {
      // update newpasssword
      const updateNewPasswordQuery = `
        update user set
          password = '${hashedPassword}';
        `
      await db.run(updateNewPasswordQuery)
      response.send('Password updated')
    }
  } else {
    response.status(400)
    response.send('Invalid current password')
  }
})

module.exports = app
