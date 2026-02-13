import { Router } from "express";
import { createTweetController, getTweetController } from "~/controllers/tweets.controller";
import { createTweetValidator, tweetIdValidator } from "~/middlewares/tweet.middlwares";
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
  /**
 * Description: Get tweet detail
 * Path: /:tweet_id
 * Method: GET
 * Header:{ Authorization?:Bearer<access_token> }
 */
tweetRouter.get("/:tweet_id",
  tweetIdValidator, 
  warpRequestHandler(getTweetController))
export default tweetRouter;