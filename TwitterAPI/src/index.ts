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
import { access } from 'fs'
import { verifyAccessToken } from './utils/common'
import { UserVerifyStatus } from './constants/enum'
import { TokenPayload } from './models/requests/users.requests'
import { ErrorWithStatus } from './models/Errors'
import { USER_MESSAGE } from './constants/messages'
import HTTP_STATUS from './constants/httpStatus'
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

const io = new Server(httpServer, {
  cors: {
    origin: '*'
  }
})

const users: {
  [key: string]: {
    socket_id: string
  }
} = {}
io.use(async (socket, next) => {
  try {
    const { Authorization } = socket.handshake.auth
    const access_token = Authorization?.split(' ')[1]
    console.log("token:", access_token)
    if (!access_token) {
      return next(new Error('No token'))
    }

    const decoded_authorization = await verifyAccessToken(access_token)


    const { verify } = decoded_authorization as TokenPayload

    if (verify !== UserVerifyStatus.Verified) {
      return next(new Error('User not verified'))
    }
    socket.handshake.auth.access_token = access_token
    socket.handshake.auth.decoded_authorization = decoded_authorization 
    next()
  } catch (error) {
    next({
      message:'Unauthorized',
      name:'UnauthorizedError',
      data:error
    })
  }
})
io.on("connection", (socket) => {
  console.log(`user ${socket.id} connected`)
  const {user_id }= socket.handshake.auth.decoded_authorization as TokenPayload
  users[user_id] = {
    socket_id: socket.id
  }
  socket.use( async (packet,next) => {
     const {access_token} = socket.handshake.auth
     try {
      await verifyAccessToken(access_token)
      next()
     } catch (error) {
      next(new Error('Unauthorized'))
     }
  })
  socket.on('error',(error) => {
    if(error.message === 'Unauthorized') {
      socket.disconnect()
    }
  })
  socket.on('send_message', async (data) => {
    const { receiver_id, sender_id, content } = data.payload
    const receiver_socket = users[receiver_id]
    if (!receiver_socket) {
      return
    }
    const receiver_socket_id = receiver_socket.socket_id
    const conversation = new Conversation({
      sender_id: new ObjectId(sender_id),
      receiver_id: new ObjectId(receiver_id),
      content: content
    })
    const result = await databaseService.conversation.insertOne(conversation)
    conversation._id = result.insertedId
    socket.to(receiver_socket_id).emit('receive_message', {
      payload: conversation,
    })

  })
  socket.on("disconnect", () => {
    delete users[user_id]
    console.log(`user ${socket.id} disconnected`)
  })

})

app.use(defaultErrorHandler)
httpServer.listen(port, () => {
  console.log(`Example app listen on port ${port}`)
})
