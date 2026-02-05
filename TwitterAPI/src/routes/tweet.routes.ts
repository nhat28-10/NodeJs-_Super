import { Router } from "express";
import { createTweetController } from "~/controllers/tweets.controller";
import { createTweetValidator } from "~/middlewares/tweet.middlwares";
import { accessTokenValidator, verifiedUserValidator } from "~/middlewares/users.middlewares";
import { warpRequestHandler } from "~/utils/handlers";

const tweetRouter = Router();

/**
 * Description: Create tweet
 * Path: /
 * Method: POST
 * body: TweetReqBody
 */
tweetRouter.post("/",
  accessTokenValidator, 
  verifiedUserValidator,
  createTweetValidator, 
  warpRequestHandler(createTweetController))
export default tweetRouter;