import { JwtPayload } from 'jsonwebtoken'

declare global {
  namespace Express {
    interface Request {
      user?: any
      decoded_authorization?: JwtPayload
      decoded_refresh_token?: JwtPayload
      decoded_verify_email_token?: JwtPayload
    }
  }
}

export {}
