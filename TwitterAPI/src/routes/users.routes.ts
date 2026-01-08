import { Router } from 'express'
import { verifyEmailController, loginController, logoutController, registerController, resendVerifyEmailController, forgotPasswordController, verifyForgotPasswordController, resetPasswordController, getProfileController, updateProfileController, followController, unfollowController, changePasswordController, oauthController } from '~/controllers/users.controller'
import { filterMiddleware } from '~/middlewares/common.middlewares'
import { accessTokenValidator, changePasswordValidator, emailTokenValidator, followValidator, forgotPasswordValidator, loginValidator, refreshTokenValidator, registerValidator, resetPasswordValidator, unfollowValidator, updateProfileValidator, verifiedUserValidator, verifyForgotPasswordTokenValidator } from '~/middlewares/users.middlewares'
import { UpdateProfileReqBody } from '~/models/requests/users.requests'
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
 * Description. Oauth with Google
 * PATH: /login
 * METHOD: GET
 * Query: {code: string}
 */
usersRouter.get('/oauth/google', warpRequestHandler(oauthController))
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

/**
 * DESCIPRTION: Submit email to reset password,send email to user
 * PATH: /forgot-password
 * METHOD: POST
 * Body: {email:string}
 */
usersRouter.post('/forgot-password', forgotPasswordValidator, warpRequestHandler(forgotPasswordController ))

/**
 * DESCIPRTION: Verify link to reset password
 * PATH: /verify-forgot-password
 * METHOD: POST
 * Body: {forgot_password_token: string}
 */
usersRouter.post('/verify-forgot-password', verifyForgotPasswordTokenValidator, warpRequestHandler(verifyForgotPasswordController))

/**
 * DESCIPRTION: Reset password
 * PATH: /reset-password
 * METHOD: POST
 * Body: {forgot_password_token: string,password:string, confirm_password:string}
 */
usersRouter.post('/reset-password', resetPasswordValidator, warpRequestHandler(resetPasswordController))

/**
 * DESCRIPTION: Get user profile
 * PATH: /my-profile
 * METHOD: GET
 * HEADER: {Authorization: Bearer <access_token>}
 */
usersRouter.get('/my-profile',accessTokenValidator,warpRequestHandler(getProfileController))

/**
 * DESCRIPTION: Update user profile
 * PATH: /my-profile
 * METHOD: PATCH
 * HEADER: {Authorization: Bearer <access_token>}
 * Body: User Schema
 */
usersRouter.patch(
  '/my-profile',
  accessTokenValidator,
  verifiedUserValidator,
  updateProfileValidator,
  filterMiddleware<UpdateProfileReqBody>(['name', 'date_of_birth', 'bio', 'location', 'website', 'avatar', 'username','cover_photo']),
  warpRequestHandler(updateProfileController))

/**
 * DESCRIPTION: User follow someone
 * PATH: /follow
 * METHOD: POST
 * Headers: {Authorization: Bearer <access_token>}
 * Body {followed_user_id: string}
 */
usersRouter.post('/follow',
  accessTokenValidator,
  verifiedUserValidator,
  followValidator, 
  warpRequestHandler(followController))
/**
 * DESCRIPTION: User unfollow someone
 * PATH: /follow/User_id
 * METHOD: DELETE
 * Headers: {Authorization: Bearer <access_token>}
 * Body {followed_user_id: string}
 */
usersRouter.delete('/follow/:user_id',
  accessTokenValidator,
  verifiedUserValidator,
  unfollowValidator, 
  warpRequestHandler(unfollowController)
)
/**
 * DESCRIPTION: User change password
 * PATH: /change-password
 * METHOD: PUT
 * Headers: {Authorization: Bearer <access_token>}
 * Body {current_password: string, password: string, confirm_password: string}
 */
usersRouter.put('/change-password',accessTokenValidator,verifiedUserValidator,changePasswordValidator,
  warpRequestHandler(changePasswordController)
)
export default usersRouter
