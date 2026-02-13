import { Router } from "express";
import { bookmarkTweetController, unbookmarkTweetController } from "~/controllers/bookmarks.controller";
import { tweetIdValidator } from "~/middlewares/tweet.middlwares";
import { accessTokenValidator, verifiedUserValidator } from "~/middlewares/users.middlewares";
import { warpRequestHandler } from "~/utils/handlers";

const bookmarkRouter = Router()
/**
 * Description: Book mark
 * PATH: /
 * METHOD:POST
 * BODY: {tweet_id: string}
 * Header: {Authorization: Bearer <access_token>}
 */
bookmarkRouter.post('',accessTokenValidator,verifiedUserValidator,tweetIdValidator,warpRequestHandler(bookmarkTweetController))
/**
 * Description: Book mark
 * PATH: /tweets/:tweet_id
 * METHOD:DELETE
 * Header: {Authorization: Bearer <access_token>}
 */
bookmarkRouter.delete('/tweets/:tweet_id',accessTokenValidator,verifiedUserValidator,tweetIdValidator,warpRequestHandler(unbookmarkTweetController))
export default bookmarkRouter