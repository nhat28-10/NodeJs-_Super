import express, {Request, Response, NextFunction} from 'express'
import usersRouter from './routes/users.routes'
import databaseService from './services/database.services'
import { defaultErrorHandler } from './middlewares/error.middlewares'
import mediasRouter from './routes/media.routes'
databaseService.connect()
const app = express()
const port = 3000
app.use(express.json())
app.use('/users', usersRouter)
app.use('/media', mediasRouter)

app.use(defaultErrorHandler)
app.listen(port, () => {
  console.log(`Example app listen on port ${port}`)
})
