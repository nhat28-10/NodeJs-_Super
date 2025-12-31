import { Router } from 'express'
import { loginController, registerController } from '~/controllers/users.controller'
import { accessTokenValidator, loginValidator, registerValidator } from '~/middlewares/users.middlewares'
import { warpRequestHandler } from '~/utils/handlers'

const usersRouter = Router()

usersRouter.use((req, res, next) => {
  console.log('Time: ', Date.now())
  next()
})
/**
 * Description. Login to system
 * PATH: /login
 * METHOD: POST
 * Body: {email:string, password:string}
 */
usersRouter.post('/login', loginValidator, warpRequestHandler(loginController))
/**
 * Description. Register a new user
 * PATH: /register
 * METHOD: POST
 * Body: {name:string,email:string, password:string,confirm_password:string,date_of_birth: ISO8601}
 */
usersRouter.post('/register', registerValidator, warpRequestHandler(registerController))
/**
 * Description: Logout a user
 * PATH: /logout
 * METHOD: POST
 * Header: {Authorization: Bearer <access_token>}
 * Body: {refresh_token:string}
 */
usersRouter.post('/logout', accessTokenValidator, warpRequestHandler((req, res) => {
  res.json({message:'Logout success'})
}))
export default usersRouter
