import { UserVerifyStatus } from "~/constants/enum"

export default class Refresh_token {
  user_id: string
  token: string
  verify: UserVerifyStatus
  created_at: Date
  updated_at: Date

  constructor({
    user_id,
    token,
    verify,
    updated_at
  }: {
    user_id: string
    token: string
    verify: UserVerifyStatus
    updated_at?: Date
  }) {
    const date = new Date()
    this.user_id = user_id
    this.verify = verify
    this.token = token
    this.created_at = new Date()
    this.created_at = date
    this.updated_at = updated_at || date
  }
}
