import { Request, Response } from 'express'
export const loginController = (req: Request, res: Response) => {
  const { email, password } = req.body
  if (email == 'nhatdeptrai281003@gmail.com' && password == '123456') {
    return res.json({ message: 'Login Success' })
  }
  return res.status(400).json({ error: 'Login fail' })
}
