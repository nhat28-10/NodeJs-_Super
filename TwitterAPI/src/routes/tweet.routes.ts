import { Router } from "express";
import { createTweetController, getTweetChildrenController, getTweetController } from "~/controllers/tweets.controller";
import { audienceValidator, createTweetValidator, getTweetChildrenValidator, tweetIdValidator } from "~/middlewares/tweet.middlwares";
import { accessTokenValidator, isUserLoggedInValidator, verifiedUserValidator } from "~/middlewares/users.middlewares";
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
  isUserLoggedInValidator(accessTokenValidator),
  isUserLoggedInValidator(verifiedUserValidator),
  audienceValidator,
  warpRequestHandler(getTweetController))
    /**
 * Description: Get Tweet Children
 * Path: /:tweet_id/children
 * Method: GET
 * Header:{ Authorization?:Bearer<access_token> }
 * Query: {limit:number, page: number, tweet_type:TweetType}
 */
tweetRouter.get("/:tweet_id/children",
  tweetIdValidator,
  getTweetChildrenValidator,
  isUserLoggedInValidator(accessTokenValidator),
  isUserLoggedInValidator(verifiedUserValidator),
  audienceValidator,
  warpRequestHandler(getTweetChildrenController))
export default tweetRouter;