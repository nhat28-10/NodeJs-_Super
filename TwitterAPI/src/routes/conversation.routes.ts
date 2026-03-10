import { Router } from "express";
import { getConversationController } from "~/controllers/conversation.controller";
import { accessTokenValidator, verifiedUserValidator } from "~/middlewares/users.middlewares";

const conversationRouter = Router()

conversationRouter.get(
  '/receivers/:receiver_id',
  accessTokenValidator,
  verifiedUserValidator,
  getConversationController
)
export default conversationRouter