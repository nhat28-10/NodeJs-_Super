import { Router } from 'express'
import { verifyEmailController, loginController, logoutController, registerController, resendVerifyEmailController, forgotPasswordController, verifyForgotPasswordController, resetPasswordController, getProfileController, updateProfileController, followController, unfollowController, changePasswordController, oauthController, refreshTokenController } from '~/controllers/users.controller'
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
 * @swagger
 * /users/login:
 *   post:
 *     tags:
 *       - users
 *     summary: Đăng nhập
 *     description: Người dùng đăng nhập vào hệ thống
 *     operationId: login
 *     requestBody:
 *       description: Thông tin đăng nhập
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginBody'
 *     responses:
 *       200:
 *         description: Đăng nhập thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Login success
 *                 result:
 *                   $ref: '#/components/schemas/SuccessAuthentication'
 *       422:
 *         description: Invalid input
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
usersRouter.post('/logout', accessTokenValidator, refreshTokenValidator, warpRequestHandler(logoutController))
/**
 * Description: Refresh token
 * PATH: /refresh-token
 * METHOD: POST
 * Body: {refresh_token:string}
 */
usersRouter.post('/refresh-token', refreshTokenValidator, warpRequestHandler(refreshTokenController))

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
usersRouter.post('/forgot-password', forgotPasswordValidator, warpRequestHandler(forgotPasswordController))

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
 * @swagger
 * /users/me:
 *   get:
 *     tags:
 *       - users
 *     summary: Lấy thông tin user
 *     description: Người dùng lấy thông tin từ tài khoản của họ
 *     operationId: me
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Lấy thông tin user thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Get profile success
 *                 result:
 *                   $ref: '#/components/schemas/User'
 */
usersRouter.get('/me', accessTokenValidator, warpRequestHandler(getProfileController))

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
  filterMiddleware<UpdateProfileReqBody>(['name', 'date_of_birth', 'bio', 'location', 'website', 'avatar', 'username', 'cover_photo']),
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
usersRouter.put('/change-password', accessTokenValidator, verifiedUserValidator, changePasswordValidator,
  warpRequestHandler(changePasswordController)
)
export default usersRouter
