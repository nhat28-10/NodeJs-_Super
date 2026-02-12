import { NextFunction,Request,Response } from "express"
import { ParamsDictionary } from "express-serve-static-core"
import { BookmarkTweetReqBody } from '../models/requests/bookmarks.request'
import { TokenPayload } from "~/models/requests/users.requests"
import bookmarkService from "~/services/bookmark.services"
import { BOOKMARK } from "~/constants/messages"
export const bookmarkTweetController = async  (req:Request<ParamsDictionary, any, BookmarkTweetReqBody>, res: Response) => {
  const {user_id} = req.decoded_authorization as TokenPayload
  const result = await bookmarkService.bookmarkTweet(user_id , req.body.tweet_id )
  return res.json({
    message:BOOKMARK.BOOKMARK_SUCCESS,
    result
  })
}
export const unbookmarkTweetController = async  (req:Request, res: Response) => {
  const {user_id} = req.decoded_authorization as TokenPayload
  await bookmarkService.unbookmarkTweet(user_id , req.params.tweet_id )
  return res.json({
    message:BOOKMARK.UNBOOKMARK_SUCCESS
  })
}