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