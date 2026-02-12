import { NextFunction,Request,Response } from "express"
import { ParamsDictionary } from "express-serve-static-core"
import { BookmarkTweetReqBody } from '../models/requests/bookmarks.request'
import { TokenPayload } from "~/models/requests/users.requests"
import likeService from "~/services/like.services"
import { LIKE } from "~/constants/messages"
export const likeTweetController = async  (req:Request<ParamsDictionary, any, BookmarkTweetReqBody>, res: Response) => {
  const {user_id} = req.decoded_authorization as TokenPayload
  const result = await likeService.likeTweet(user_id , req.body.tweet_id )
  return res.json({
    message:LIKE.LIKE_SUCCESS,
    result
  })
}
export const unlikeTweetController = async  (req:Request, res: Response) => {
  const {user_id} = req.decoded_authorization as TokenPayload
  await likeService.unlikeTweet(user_id , req.params.tweet_id )
  return res.json({
    message:LIKE.UNLIKE_SUCCESS
  })
}