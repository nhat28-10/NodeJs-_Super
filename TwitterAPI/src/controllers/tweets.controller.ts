import { NextFunction,Request,Response } from "express"
import { ParamsDictionary } from "express-serve-static-core"
import { TweetReqBody } from "~/models/requests/tweets.request"
export const createTweetController = async  (req:Request<ParamsDictionary, any, TweetReqBody>, res: Response) => {
  return res.send('createtweetController')
}