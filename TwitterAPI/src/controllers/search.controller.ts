import { NextFunction, Request, Response } from "express"
import { ParamsDictionary } from "express-serve-static-core"
import { PeopleFollow } from "~/constants/enum"
import { SearchQuery } from "~/models/requests/search.request"
import searchService from "~/services/search.services"

export const searchController = async (
  req: Request<ParamsDictionary, any, any, SearchQuery>,
  res: Response
) => {
  const limit = Number(req.query.limit) || 10
  const page = Number(req.query.page) || 1

  const user_id = req.decoded_authorization?.user_id

  const result = await searchService.search({
    limit,
    page,
    content: req.query.content, 
    media_type: req.query.media_type,
    people_follow: req.query.people_follow,
    user_id
  })

  return res.json({
    message: "Search successfully",
    result: {
      tweets:result.tweets,
      limit,
      page,
      total_page: Math.ceil(result.total / limit) 
    }
  })
}