import { JwtPayload } from "jsonwebtoken"
import { TokenType, UserVerifyStatus } from "~/constants/enum"
import { ParamsDictionary } from 'express-serve-static-core'

export interface LoginRequestBody {
  email: string
  password: string
}
export interface RegisterRequest {
  name: string
  email: string
  password: string
  confirm_password: string
  date_of_birth: string
}
export interface TokenPayload extends JwtPayload {
  user_id: string
  token_type: TokenType
  verify: UserVerifyStatus
  exp: number
  iat: number
}
export interface LogoutReqBody {
  refresh_token: string
}
export interface RefreshTokenReqBody {
  refresh_token: string
}

export interface VerifyEmailReqBody {
  email_verify_token: string
}
export interface forgotPasswordReqBody {
  email: string
}
export interface VerifyForgotPasswordReqBody {
  forgot_password_token: string
}
export interface ResetPasswordReqBody {
  password: string
  confirm_password: string
  forgot_password_token: string
}

export interface UpdateProfileReqBody {
  name?: string,
  date_of_birth?: string,
  bio?: string,
  location?: string,
  website?: string,
  username?: string,
  avatar?: string,
  cover_photo?: string,
}

export interface FollowReqBody {
  followed_user_id: string
}

export interface UnfollowReqParams extends ParamsDictionary {
  user_id: string
}

export interface ChangePasswordReqBody {
  current_password: string
  password: string
  confirm_password: string
}
/**
 * @swagger
 * components:
 *   schemas:
 *     LoginBody:
 *       type: object
 *       properties:
 *         email:
 *           type: string
 *           example: nhat1@gmail.com
 *         password:
 *           type: string
 *           example: Nhat12345@
 *
 *     SuccessAuthentication:
 *       type: object
 *       properties:
 *         access_token:
 *           type: string
 *         refresh_token:
 *           type: string
 *
 *     User:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: 69a5247222f340317726860b
 *         name:
 *           type: string
 *           example: Nhat
 *         email:
 *           type: string
 *           example: nhat1@gmail.com
 *         username:
 *           type: string
 *           example: nhat1
 *
 *     UserVerifyStatus:
 *       type: number
 *       enum: [0,1,2]
 *       example: 1
 */