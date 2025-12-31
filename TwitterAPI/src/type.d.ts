import {Request} from 'express'
import User from './models/schemas/Users.model'
declare module 'express' {
  interface Request {
    user?: User
  }
}