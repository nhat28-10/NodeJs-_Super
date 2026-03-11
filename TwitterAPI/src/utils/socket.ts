
import { ObjectId } from "mongodb"
import { Server } from "socket.io"
import Conversation from "~/models/schemas/Conversation.schemas"
import { verifyAccessToken } from "./common"
import { TokenPayload } from "~/models/requests/users.requests"
import { UserVerifyStatus } from "~/constants/enum"
import databaseService from "~/services/database.services"
import { Server as ServerHttp } from "http"

const initSocket = (httpServer: ServerHttp) => {
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
        message: 'Unauthorized',
        name: 'UnauthorizedError',
        data: error
      })
    }
  })
  io.on("connection", (socket) => {
    console.log(`user ${socket.id} connected`)
    const { user_id } = socket.handshake.auth.decoded_authorization as TokenPayload
    users[user_id] = {
      socket_id: socket.id
    }
    socket.use(async (packet, next) => {
      const { access_token } = socket.handshake.auth
      try {
        await verifyAccessToken(access_token)
        next()
      } catch (error) {
        next(new Error('Unauthorized'))
      }
    })
    socket.on('error', (error) => {
      if (error.message === 'Unauthorized') {
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
}
export default initSocket