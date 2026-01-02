import { Router } from 'express'
import { verifyEmailController, loginController, logoutController, registerController, resendVerifyEmailController } from '~/controllers/users.controller'
import { accessTokenValidator, emailTokenValidator, loginValidator, refreshTokenValidator, registerValidator } from '~/middlewares/users.middlewares'
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
usersRouter.post('/logout', accessTokenValidator,refreshTokenValidator, warpRequestHandler(logoutController))

/**
 * Description: Verify email user when user click on the link in email
 * PATH: /verify-email
 * METHOD: POST
 * body: {refresh_token: string}
 */
usersRouter.post('/verify-email', emailTokenValidator, warpRequestHandler(verifyEmailController))
/**
 * Description: Resend verify email user
 * PATH: /resend-verify-email
 * METHOD:POST
 * Header: {Authorization: Bearer <access_token>}
 */
usersRouter.post('/resend-verify-email', accessTokenValidator, warpRequestHandler(resendVerifyEmailController))

export default usersRouter
