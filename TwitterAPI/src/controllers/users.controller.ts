import { Request, Response } from 'express'
import usersService from '~/services/users.service'
import { NextFunction, ParamsDictionary } from 'express-serve-static-core'
import { forgotPasswordReqBody, LoginRequestBody, LogoutReqBody, RegisterRequest, ResetPasswordReqBody, TokenPayload, UpdateProfileReqBody, VerifyEmailReqBody, VerifyForgotPasswordReqBody } from '~/models/requests/users.requests'
import { ObjectId } from 'mongodb'
import User from '~/models/schemas/Users.model'
import { USER_MESSAGE } from '~/constants/messages'
import { ref } from 'process'
import databaseService from '~/services/database.services'
import HTTP_STATUS from '~/constants/httpStatus'
import { UserVerifyStatus } from '~/constants/enum'
import { result } from 'lodash'

export const loginController = async  (req:Request<ParamsDictionary, any, LoginRequestBody>, res: Response) => {
  const user = req.user as User
  const user_id = user._id as ObjectId
  const result = await usersService.login({user_id: user_id.toString(), verify: user.verify})
  return res.json({
    message: USER_MESSAGE.LOGIN_SUCCESS,
    result
  })
}

export const registerController = async (req: Request<ParamsDictionary, any, RegisterRequest>, res: Response, next: NextFunction) => {
    
    const result = await usersService.register(req.body)
    return res.json({ message: USER_MESSAGE.REGISTER_SUCCESS, result })
}

export const logoutController = async (req:Request<ParamsDictionary, any, LogoutReqBody>, res:Response) => {
  const {refresh_token} = req.body
  const result = await usersService.logout(refresh_token)
  return res.json(result)
}
export const verifyEmailController = async (req:Request<ParamsDictionary, any, VerifyEmailReqBody>, res:Response, next:NextFunction) => {
  const {user_id} = req.decoded_email_verify_token as TokenPayload
  const user = await databaseService.users.findOne({
    _id: new ObjectId(user_id)
  })
  if (!user) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      message: USER_MESSAGE.USER_NOT_FOUND
    })
  }
  // Đã verify email rồi thì sẽ không báo lỗi
  // Sẽ trả về status OK với message : 'Email đã được verify trước đó rồi'
  if (user.email_verify_token === '') {
    return res.json({
      message: USER_MESSAGE.EMAIL_VERIFIED
    })
  }
  const result = await usersService.verifyEmail(user_id)
  return res.json({
    message: USER_MESSAGE.VERIFY_EMAIL_SUCCESS,
    result
  })
}
export const resendVerifyEmailController = async (req:Request, res:Response, next: NextFunction) => {
  const {user_id} = req.decoded_authorization as TokenPayload
  const user = await databaseService.users.findOne({_id: new ObjectId(user_id)})
  if(!user) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      message: USER_MESSAGE.USER_NOT_FOUND
    })
  }
  if(user.verify === UserVerifyStatus.Verified) {
    return res.json({
      message: USER_MESSAGE.EMAIL_VERIFIED
    })
  }
  const result = await usersService.resendVerifyEmail(user_id)
  return res.json(result)
}

export const forgotPasswordController = async (req:Request<ParamsDictionary, any, forgotPasswordReqBody>, res:Response, next: NextFunction) => {
  const { _id, verify} = req.user as User
  const result = await usersService.forgotPassword({user_id:(_id as ObjectId).toString(), verify})
  return res.json(result)
}
export const verifyForgotPasswordController = async (req:Request<ParamsDictionary, any, VerifyForgotPasswordReqBody>, res:Response, next: NextFunction) => {
  return res.json({
    message: USER_MESSAGE.VERIFY_FORGOT_PASSWORD_SUCCESS
  })
}
export const resetPasswordController = async (req:Request<ParamsDictionary, any, ResetPasswordReqBody>, res: Response, next: NextFunction) => {
  const {user_id} = req.decoded_forgot_password_token as TokenPayload
  const {password} = req.body
  const result = await usersService.resetPassword(user_id, password)
  return res.json(result)
}

export const getProfileController = async (req:Request, res: Response, next: NextFunction) => {
  const { user_id } = req.decoded_authorization as TokenPayload
  const user = await usersService.getProfile(user_id) 
  return res.json({
    message:USER_MESSAGE.GET_PROFILE_SUCCESS,
    result: user
  })
}

export const updateProfileController = async (req: Request<ParamsDictionary, any, UpdateProfileReqBody>, res:Response, next:NextFunction) => {
  const {user_id} = req.decoded_authorization as TokenPayload
  const {body} = req
  const user = await usersService.updateProfile(user_id,body)
  return res.json({
    message: USER_MESSAGE.UDPATE_PROFILE_SUCCESS,
    result: user
  })
}

