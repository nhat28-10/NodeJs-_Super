import { Request, Response } from 'express'
import usersService from '~/services/users.service'
import { NextFunction, ParamsDictionary } from 'express-serve-static-core'
import { RegisterRequest } from '~/models/requests/users.requests'
import { ObjectId } from 'mongodb'
import User from '~/models/schemas/Users.model'
import { USER_MESSAGE } from '~/constants/messages'

export const loginController = async  (req: Request, res: Response) => {
  const user = req.user as User
  const user_id = user._id as ObjectId
  const result = await usersService.login(user_id.toString())
  return res.json({
    message: USER_MESSAGE.LOGIN_SUCCESS,
    result
  })
}

export const registerController = async (req: Request<ParamsDictionary, any, RegisterRequest>, res: Response, next: NextFunction) => {
    
    const result = await usersService.register(req.body)
    return res.json({ message: USER_MESSAGE.REGISTER_SUCCESS, result })
}
