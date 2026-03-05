import express from 'express'

import databaseService from './services/database.services'
import { defaultErrorHandler } from './middlewares/error.middlewares'
import mediasRouter from './routes/media.routes'
import usersRouter from './routes/users.routes'
import tweetRouter from './routes/tweet.routes'
import { initFolder } from './utils/file'
import { config } from 'dotenv'
import { UPLOAD_DIR, UPLOAD_VIDEO_DIR } from './constants/dir'
import staticRouter from './routes/static.routes'
import cors from 'cors'
import bookmarkRouter from './routes/bookmark.routes'
import likeRouter from './routes/like.routes'
import searchRouter from './routes/search.routes'

config()
databaseService.connect().then(
  () => {
    databaseService.indexUsers()
    databaseService.indexRefreshTokens()
    databaseService.indexVideoStatus()
    databaseService.indexFollowers()
    databaseService.indexTweets()
  }
)
const app = express()
const port = process.env.PORT || 3000

initFolder()
app.use(cors())
app.use(express.json())
app.use('/users', usersRouter)
app.use('/medias', mediasRouter)
app.use('/static',staticRouter)
app.use('/tweets',tweetRouter)
app.use('/bookmarks',bookmarkRouter)
app.use('/likes',likeRouter)
app.use('/search',searchRouter)
app.use('/static/video', express.static(UPLOAD_VIDEO_DIR))

app.use(defaultErrorHandler)
app.listen(port, () => {
  console.log(`Example app listen on port ${port}`)
})
