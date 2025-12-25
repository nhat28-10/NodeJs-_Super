import { Router } from 'express'
import { loginValidator } from '~/middlewares/users.middlewares'

const usersRouter = Router()

usersRouter.use((req, res, next) => {
  console.log('Time: ', Date.now())
  next()
})

usersRouter.post('/login', loginValidator, (req, res) => {
  res.json({
    message: 'Login successfully'
  })
})
export default usersRouter
