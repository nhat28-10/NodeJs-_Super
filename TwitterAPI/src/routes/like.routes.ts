import { Router } from "express";
import { likeTweetController, unlikeTweetController } from "~/controllers/like.controller";
import { accessTokenValidator, verifiedUserValidator } from "~/middlewares/users.middlewares";
import { warpRequestHandler } from "~/utils/handlers";

const likeRouter = Router()
/**
 * Description: Book mark
 * PATH: /
 * METHOD:POST
 * BODY: {tweet_id: string}
 * Header: {Authorization: Bearer <access_token>}
 */
likeRouter.post('',accessTokenValidator,verifiedUserValidator,warpRequestHandler(likeTweetController))
/**
 * Description: Book mark
 * PATH: /tweets/:tweet_id
 * METHOD:POST
 * BODY: {tweet_id: string}
 * Header: {Authorization: Bearer <access_token>}
 */
likeRouter.delete('/tweets/:tweet_id',accessTokenValidator,verifiedUserValidator,warpRequestHandler(unlikeTweetController))
export default likeRouter