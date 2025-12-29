import { Request, Response } from 'express'
import usersService from '~/services/users.service'
import { NextFunction, ParamsDictionary } from 'express-serve-static-core'
import { RegisterRequest } from '~/models/requests/users.requests'

export const loginController = (req: Request, res: Response) => {
  const { email, password } = req.body
  if (email == 'nhatdeptrai281003@gmail.com' && password == '123456') {
    return res.json({ message: 'Login Success' })
  }
  return res.status(400).json({ error: 'Login fail' })
}

export const registerController = async (req: Request<ParamsDictionary, any, RegisterRequest>, res: Response, next: NextFunction) => {
    
    const result = await usersService.register(req.body)
    return res.json({ message: 'Register Success', result })
}
