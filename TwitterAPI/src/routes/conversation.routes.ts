import { Router } from "express";
import { getConversationController } from "~/controllers/conversation.controller";
import { paginationValidator } from "~/middlewares/tweet.middlwares";
import { accessTokenValidator, getConversationValidator, verifiedUserValidator } from "~/middlewares/users.middlewares";
import { warpRequestHandler } from "~/utils/handlers";

const conversationRouter = Router()

conversationRouter.get(
  '/receivers/:receiver_id',
  accessTokenValidator,
  verifiedUserValidator,
  paginationValidator,
  getConversationValidator,
  warpRequestHandler(getConversationController)
)
export default conversationRouter