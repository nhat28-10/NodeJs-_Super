import { NextFunction,Request,Response } from "express"
import { ParamsDictionary } from "express-serve-static-core"
import { body } from "express-validator"
import { TweetReqBody } from "~/models/requests/tweets.request"
import { TokenPayload } from "~/models/requests/users.requests"
import tweetServices from "~/services/tweets.services"
export const createTweetController = async  (req:Request<ParamsDictionary, any, TweetReqBody>, res: Response) => {
  const {user_id} = req.decoded_authorization as TokenPayload
  const result = await tweetServices.createTweet(user_id , req.body )
  return res.json({
    message:'Create tweet successfully',
    result
  })
}
export const getTweetController = async  (req:Request<ParamsDictionary, any, TweetReqBody>, res: Response) => {
  const result = await tweetServices.increaseView(req.params.tweet_id,req.decoded_authorization?.user_id)
  const tweet = {
    ...req.tweet,
    guest_views: result.guest_views,
    user_views: result.user_views
  }
  
  return res.json({
    message:'Get tweet detail successfully',
    result: tweet
  })
}