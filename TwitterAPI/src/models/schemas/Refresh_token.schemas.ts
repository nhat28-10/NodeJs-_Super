import { UserVerifyStatus } from "~/constants/enum"
import { ObjectId } from "mongodb"

export default class RefreshToken {
  user_id: ObjectId | string
  token: string
  verify: UserVerifyStatus
  created_at: Date
  updated_at: Date
  iat: number
  exp: number

  constructor({
    user_id,
    token,
    verify,
    updated_at,
    iat,
    exp
  }: {
    user_id: ObjectId | string
    token: string
    verify: UserVerifyStatus
    updated_at?: Date
    iat: number
    exp: number
  }) {
    const date = new Date()
    this.user_id = user_id
    this.verify = verify
    this.token = token
    this.created_at = new Date()
    this.created_at = date
    this.updated_at = updated_at || date
    this.iat = iat
    this.exp = exp
  }
}
