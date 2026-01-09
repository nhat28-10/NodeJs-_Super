import User from '~/models/schemas/Users.model'
import databaseService from './database.services'
import RefreshToken from '../models/schemas/Refresh_token.schemas'
import { RegisterRequest, UpdateProfileReqBody } from '~/models/requests/users.requests'
import { hashPassword } from '~/utils/crypto'
import { signToken, verifyToken } from '~/utils/jwt'
import { TokenType, UserVerifyStatus } from '~/constants/enum'
import { SignOptions } from 'jsonwebtoken'
import { ObjectId } from 'mongodb'
import { USER_MESSAGE } from '~/constants/messages'
import { access } from 'fs'
import { update } from 'lodash'
import axios from 'axios'
import Follower from '~/models/schemas/Followers.schemas'
import { ErrorWithStatus } from '~/models/Errors'
import HTTP_STATUS from '~/constants/httpStatus'
import { verify } from 'crypto'
class UsersService {
  private signAccessToken({ user_id, verify }: { user_id: string, verify: UserVerifyStatus }) {
    return signToken({
      payload: {
        user_id,
        token_type: TokenType.AccessToken,
        verify
      },
      privateKey: process.env.JWT_SECRET_ACCESS_TOKEN as string,
      options: {
        expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN as SignOptions['expiresIn']
      }
    })
  }
  private signRefreshToken({ user_id, verify }: { user_id: string, verify: UserVerifyStatus }) {
    return signToken({
      payload: {
        user_id,
        token_type: TokenType.RefreshToken,
        verify
      },
      privateKey: process.env.JWT_SECRET_REFRESH_TOKEN as string,
      options: {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN as SignOptions['expiresIn']
      }
    })
  }
  private signEmailVerifyToken({ user_id, verify }: { user_id: string, verify: UserVerifyStatus }) {
    return signToken({
      payload: {
        user_id,
        token_type: TokenType.EmailVerifyToken,
        verify
      },
      privateKey: process.env.JWT_SECRET_EMAIL_VERIFY_TOKEN as string,
      options: {
        expiresIn: process.env.EMAIL_VERIFY_TOKEN_EXPIRES_IN as SignOptions['expiresIn']
      }
    })
  }
  private signAccessAndRefreshToken({ user_id, verify }: { user_id: string, verify: UserVerifyStatus }) {
    return Promise.all([
      this.signAccessToken({ user_id, verify }),
      this.signRefreshToken({ user_id, verify })
    ])
  }
  private signForgotPasswordToken({ user_id, verify }: { user_id: string, verify: UserVerifyStatus }) {
    return signToken({
      payload: {
        user_id,
        token_type: TokenType.ForgotPasswordToken,
        verify
      },
      privateKey: process.env.JWT_SECRET_FORGOT_PASSWORD_TOKEN as string,
      options: {
        expiresIn: process.env.FORGOT_PASSWORD_TOKEN_EXPIRES_IN as SignOptions['expiresIn']
      }
    })
  }
  private async getOauthGoogleToken(code: string) {
    const body = new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: process.env.GOOGLE_REDIRECT_URI!,
      grant_type: 'authorization_code'
    })
    const { data } = await axios.post('https://oauth2.googleapis.com/token', body, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    })
    return data as {
      access_token :string
      id_token: string
    }
  }
  private async getGoogleUserInfo(access_token:string, id_token:string) {
    const {data} = await axios.get(
      'https://www.googleapis.com/oauth2/v1/userinfo',
      {
        params: {
          access_token,
          alt: 'json'
        },
        headers:{
          Authorization: `Bearer ${id_token}`
        }
      })
      return data as {
        id: string,
        email: string,
        verified_email: string,
        name:string,
        given_name:string,
        picture:string,
      }
  }
  async register(payload: RegisterRequest) {
    const user_id = new ObjectId()
    const email_verify_token = await this.signEmailVerifyToken({ user_id: user_id.toString(), verify: UserVerifyStatus.Unverified })
    await databaseService.users.insertOne(
      new User({
        ...payload,
        _id: user_id,
        email_verify_token,
        date_of_birth: new Date(payload.date_of_birth),
        password: hashPassword(payload.password)
      })
    )
    console.log('email_verify_token: ', email_verify_token)
    const [access_token, refresh_token] = await this.signAccessAndRefreshToken({ user_id: user_id.toString(), verify: UserVerifyStatus.Unverified })
    return { access_token, refresh_token }
  }
  async checkEmailExists(email: string) {
    const user = await databaseService.users.findOne({ email })
    return Boolean(user)
  }
  async login({ user_id, verify }: { user_id: string, verify: UserVerifyStatus }) {
    const [access_token, refresh_token] =
      await this.signAccessAndRefreshToken({ user_id, verify: UserVerifyStatus.Verified })

    // decode refresh token để lấy iat, exp
    const decoded = await verifyToken({ token: refresh_token, secretOrPublicKey: process.env.JWT_SECRET_REFRESH_TOKEN as string })

    // 🔥 LƯU REFRESH TOKEN VÀO DATABASE
    await databaseService.refreshTokens.insertOne({
      token: refresh_token,
      user_id: new ObjectId(user_id),
      iat: decoded.iat,
      exp: decoded.exp
    })

    return {
      access_token,
      refresh_token
    }
  }

  async oauth(code: string) {
    const {access_token, id_token} = await this.getOauthGoogleToken(code)
    const userInfo = await this.getGoogleUserInfo(access_token, id_token)
    console.log(userInfo)
    if(!userInfo.verified_email) {
      throw new ErrorWithStatus({
        message: USER_MESSAGE.GMAIL_NOT_VERIFIED,
        status: HTTP_STATUS.BAD_REQUEST
      })
    }
    // Kiem tra email da duoc dky chua
    const user = await databaseService.users.findOne({email: userInfo.email})
    // Neu ton tai thi cho login vao he thong
    if(user) {
      const [access_token, refresh_token] = await this.signAccessAndRefreshToken({
        user_id: user._id.toString(),
        verify: user.verify
      })
      await databaseService.refreshTokens.insertOne(new RefreshToken({user_id: user._id, token: refresh_token, verify: user.verify}) )
      return {access_token, refresh_token, newUser:0, verify: user.verify}
    } else {
      const password = Math.random().toString(36).substring(2,15)
      const data = await this.register({
        email: userInfo.email,
        name: userInfo.name,
        date_of_birth: new Date().toISOString(),
        password,
        confirm_password: password
      })
      return {...data, newUser:1, verify: UserVerifyStatus.Unverified}
    }
  }
  async logout(refresh_token: string) {
    await databaseService.refreshTokens.deleteOne({ token: refresh_token })
    return {
      message: USER_MESSAGE.LOGOUT_SUCCES
    }
  }
  async verifyEmail(user_id: string) {

    const [token] = await Promise.all([this.signAccessAndRefreshToken({ user_id, verify: UserVerifyStatus.Verified }),
    await databaseService.users.updateOne(
      { _id: new ObjectId(user_id) },
      [{
        $set: {
          email_verify_token: '',
          verify_status: UserVerifyStatus.Verified,
          updated_at: '$$NOW'
        },
      }]
    )
    ])
    const [access_token, refresh_token] = token
    await databaseService.refreshTokens.insertOne(
      new RefreshToken({ user_id: new ObjectId(user_id), token: refresh_token, verify: UserVerifyStatus.Verified })
    )
    return {
      access_token,
      refresh_token
    }
  }
  async resendVerifyEmail(user_id: string) {
    const email_verify_token = await this.signEmailVerifyToken({ user_id, verify: UserVerifyStatus.Unverified })
    console.log('Resend verify email: ', email_verify_token)
    await databaseService.users.updateOne({ _id: new ObjectId(user_id) }, {
      $set: {
        email_verify_token
      },
      $currentDate: {
        updated_at: true
      }
    })
    return {
      message: USER_MESSAGE.RESEND_VERIFY_EMAIL_SUCCESS
    }
  }
  async forgotPassword({ user_id, verify }: { user_id: string, verify: UserVerifyStatus }) {
    const forgot_password_token = await this.signForgotPasswordToken({ user_id, verify })
    await databaseService.users.updateOne(
      { _id: new ObjectId(user_id) },
      [{
        $set: {
          forgot_password_token,
          updated_at: '$$NOW'
        }
      }]
    )
    // Gửi email kèm đường link đến email người dùng
    console.log('forgot_password_token: ', forgot_password_token)
    return {
      message: USER_MESSAGE.CHECK_EMAIL_TO_RESET_PASSWORD
    }
  }
  async resetPassword(user_id: string, password: string) {
    databaseService.users.updateOne(
      { _id: new ObjectId(user_id) },
      {
        $set: {
          forgot_password_token: '',
          password: hashPassword(password),
        },
        $currentDate: {
          updated_at: true
        }
      }
    )
    return {
      message: USER_MESSAGE.RESET_PASSWORD_SUCCESS
    }
  }
  async getProfile(user_id: string) {
    const user = await databaseService.users.findOne({ _id: new ObjectId(user_id) }, {
      projection: {
        password: 0,
        email_verify_token: 0,
        forgot_password_token: 0
      }
    })
    return user
  }
  async updateProfile(user_id: string, payload: UpdateProfileReqBody) {
    const _payload = payload.date_of_birth ? { ...payload, date_of_birth: new Date(payload.date_of_birth) } : payload
    const user = await databaseService.users.findOneAndUpdate(
      { _id: new ObjectId(user_id) },
      {
        $set: {
          ...(_payload as UpdateProfileReqBody & { date_of_birth?: Date })
        },
        $currentDate: {
          updated_at: true
        },
      },
      {
        returnDocument: 'after',
        projection: {
          password: 0,
          email_verify_token: 0,
          forgot_password_token: 0
        }
      }
    )
    return user
  }
  async follow(user_id: string, followed_user_id: string) {
    const follower = await databaseService.followers.findOne({
      user_id: new ObjectId(user_id),
      followed_user_id: new ObjectId(followed_user_id)
    })
    if (follower === null) {
      await databaseService.followers.insertOne(new Follower({
        user_id: new ObjectId(user_id),
        followed_user_id: new ObjectId(followed_user_id)
      }))
      return {
        message: USER_MESSAGE.FOLLOW_SUCCESS
      }
    }
    return {
      message: USER_MESSAGE.FOLLOWED
    }
  }
  async unfollow(user_id: string, followed_user_id: string) {
    const follower = await databaseService.followers.findOne({
      user_id: new ObjectId(user_id),
      followed_user_id: new ObjectId(followed_user_id)
    })
    if (follower === null) {
      return {
        message: USER_MESSAGE.ALREADY_UNFOLLOW
      }
    }
    await databaseService.followers.deleteOne({
      user_id: new ObjectId(user_id),
      followed_user_id: new ObjectId(followed_user_id)
    })
    return {
      message: USER_MESSAGE.UNFOLLOW_SUCCESS
    }
  }
  async changePassword(user_id: string, new_password: string) {
    await databaseService.users.updateOne(
      { _id: new ObjectId(user_id) },
      {
        $set: {
          password: hashPassword(new_password)
        },
        $currentDate: {
          updated_at: true
        }
      }
    )
    await databaseService.refreshTokens.deleteMany({ user_id: new Object(user_id) })
    return {
      message: USER_MESSAGE.CHANGE_PASSWORD_SUCCESS
    }
  }
}


const usersService = new UsersService()
export default usersService
