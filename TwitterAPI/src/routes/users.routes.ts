import { Router } from 'express'
import { loginController, registerController } from '~/controllers/users.controller'
import { loginValidator, registerValidator } from '~/middlewares/users.middlewares'
import { warpRequestHandler } from '~/utils/handlers'

const usersRouter = Router()

usersRouter.use((req, res, next) => {
  console.log('Time: ', Date.now())
  next()
})

usersRouter.post('/login', loginValidator, loginController)
/**
 * Description. Register a new user
 * PATH: /register
 * METHOD: POST
 * Body: {name:string,email:string, password:string,confirm_password:string,date_of_birth: ISO8601}
 */
usersRouter.post('/register', registerValidator, warpRequestHandler(registerController))
export default usersRouter
