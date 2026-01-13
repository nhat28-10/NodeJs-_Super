import express, {Request, Response, NextFunction} from 'express'
import usersRouter from './routes/users.routes'
import databaseService from './services/database.services'
import { defaultErrorHandler } from './middlewares/error.middlewares'
import mediasRouter from './routes/media.routes'
import { initFolder } from './utils/file'
import { config } from 'dotenv'
import { isProduction } from './constants/config'
import { UPLOAD_DIR } from './constants/dir'

config()
databaseService.connect()
const app = express()
const port = process.env.PORT || 3000

initFolder()
app.use(express.json())
app.use('/users', usersRouter)
app.use('/medias', mediasRouter)
app.use('/static',express.static(UPLOAD_DIR))

app.use(defaultErrorHandler)
app.listen(port, () => {
  console.log(`Example app listen on port ${port}`)
})
