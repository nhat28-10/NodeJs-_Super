import User from '~/models/schemas/Users.model'
import databaseService from './database.services'
import { RegisterRequest } from '~/models/requests/users.requests'
import { hashPassword } from '~/utils/crypto'
import { signToken } from '~/utils/jwt'
import { TokenType } from '~/constants/enum'
import { SignOptions } from 'jsonwebtoken'
class UsersService {
  private signAccessToken(user_id:string) {
    return signToken({
      payload: {
        user_id,
        token_type: TokenType.AccessToken
      },
      options:{
        expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN as SignOptions['expiresIn']
      }
    })
  }
  private signRefreshToken(user_id:string) {
    return signToken({
      payload: {
        user_id,
        token_type: TokenType.RefreshToken
      },
      options:{
        expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN as SignOptions['expiresIn']
      }
    })
  }
  private signAccessAndRefreshToken(user_id: string) {
    return Promise.all([
      this.signAccessToken(user_id),
      this.signRefreshToken(user_id)
    ])
  }
  async register(payload: RegisterRequest) {
    const result = await databaseService.users.insertOne(
      new User({
        ...payload,
        date_of_birth: new Date(payload.date_of_birth),
        password: hashPassword(payload.password)
      })
    )
    const user_id = result.insertedId.toString()
    const [access_token, refresh_token] = await this.signAccessAndRefreshToken(user_id)
    return {access_token,refresh_token}
  }
  async checkEmailExists(email: string) {
    const user = await databaseService.users.findOne({ email })
    return Boolean(user)
  }
  async login(user_id: string) {
    const [access_token, refresh_token] = await this.signAccessAndRefreshToken(user_id)
    return {access_token, refresh_token}
  }
}

const usersService = new UsersService()
export default usersService
