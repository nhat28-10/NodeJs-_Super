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
import { createServer } from 'http'
import { Server } from 'socket.io'
import Conversation from './models/schemas/Conversation.schemas'
import conversationRouter from './routes/conversation.routes'
import { ObjectId } from 'mongodb'

import { verifyAccessToken } from './utils/common'
import { UserVerifyStatus } from './constants/enum'
import { TokenPayload } from './models/requests/users.requests'
import initSocket from './utils/socket'

config()
databaseService.connect().then(
  () => {
    databaseService.indexUsers()
    databaseService.indexRefreshTokens()
    databaseService.indexVideoStatus()
    databaseService.indexFollowers()
    databaseService.indexTweets()
    databaseService.indexConversation()
  }
)
const app = express()
const httpServer = createServer(app);
const port = process.env.PORT || 3000

initFolder()
app.use(cors())
app.use(express.json())
app.use('/users', usersRouter)
app.use('/medias', mediasRouter)
app.use('/static', staticRouter)
app.use('/tweets', tweetRouter)
app.use('/bookmarks', bookmarkRouter)
app.use('/likes', likeRouter)
app.use('/search', searchRouter)
app.use('/conversations', conversationRouter)
app.use('/static/video', express.static(UPLOAD_VIDEO_DIR))

initSocket(httpServer)

app.use(defaultErrorHandler)
httpServer.listen(port, () => {
  console.log(`Example app listen on port ${port}`)
})
