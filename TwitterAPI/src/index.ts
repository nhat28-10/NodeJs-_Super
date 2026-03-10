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
app.use('/conversation',conversationRouter)
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
io.on("connection", (socket) => {
  console.log(`user ${socket.id} connected`)
  const user_id = socket.handshake.auth._id
  users[user_id] = {
    socket_id: socket.id
  }
  console.log(users)
  socket.on('private message', async (data) => {
    const receiver_socket_id = users[data.to].socket_id
    if (!receiver_socket_id) {
      return
    }
    await databaseService.conversation.insertOne(new Conversation({
      sender_id: new ObjectId(data.from),
      receiver_id: new ObjectId(data.to),
      content: data.content
    }))
    socket.to(receiver_socket_id).emit('receive private message', {
      content: data.content,
      from: user_id
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
