import { Router } from "express";
import { bookmarkTweetController } from "~/controllers/bookmarks.controller";
import { accessTokenValidator, verifiedUserValidator } from "~/middlewares/users.middlewares";
import { warpRequestHandler } from "~/utils/handlers";

const bookmarkRouter = Router()
/**
 * Description: Book mark
 * PATH: /bookmark
 * METHOD:POST
 * BODY: {tweet_id: string}
 * Header: {Authorization: Bearer <access_token>}
 */
bookmarkRouter.post('/',accessTokenValidator,verifiedUserValidator,warpRequestHandler(bookmarkTweetController))
export default bookmarkRouter