import { SearchQuery } from "~/models/requests/search.request"
import databaseService from "./database.services"
import { ObjectId } from "mongodb"
import { MediaType, MediaTypeQuery, PeopleFollow, TweetType } from "~/constants/enum"

class SearchService {
  async search({
    limit,
    page,
    content,
    user_id,
    media_type,
    people_follow
  }: {
    limit: number
    page: number
    content: string
    user_id?: string
    media_type?: MediaTypeQuery
    people_follow?: PeopleFollow
  }) {
    const skip = limit * (page - 1)
    const audienceMatch = user_id
      ? {
        $or: [
          { audience: 0 },
          { user_id: new ObjectId(user_id) },
          {
            audience: 1
          }
        ]
      }
      : {
        $or: [
          { audience: 0 },
          { audience: 1 }
        ]
      }
    const conditions: any[] = [
      {
        $text: {
          $search: content
        }
      },
      audienceMatch
    ]
    if (media_type === MediaTypeQuery.Image) {
      conditions.push({
        'medias.type': MediaType.Image
      })
    }
    if (media_type === MediaTypeQuery.Video) {
      conditions.push({
        'medias.type': {
          $in: [MediaType.Video, MediaType.HLS]
        }
      })
    }
    if (people_follow && people_follow === PeopleFollow.Following) {
      const user_id_obj = new ObjectId(user_id)
      const followed_user_ids = await databaseService.followers.find({
        user_id: user_id_obj
      }, {
        projection: {
          followed_user_id: 1,
          _id: 0
        }
      }).toArray()
      const ids = followed_user_ids.map((item) => item.followed_user_id)
      ids.push(user_id_obj)
      conditions.push({
        user_id : {
          $in:ids
        }
      })
    }
    const matchStage = {
      $match: {
        $and: conditions
      }
    }

    const pipeline = [

      // search first
      matchStage,

      // pagination early (very important)
      { $sort: { created_at: -1 } },
      { $skip: skip },
      { $limit: limit },

      // user
      {
        $lookup: {
          from: "users",
          localField: "user_id",
          foreignField: "_id",
          as: "user"
        }
      },
      { $unwind: "$user" },

      // hashtags
      {
        $lookup: {
          from: "hashtags",
          localField: "hashtags",
          foreignField: "_id",
          as: "hashtags"
        }
      },

      // mentions
      {
        $lookup: {
          from: "users",
          localField: "mentions",
          foreignField: "_id",
          as: "mentions"
        }
      },

      // likes
      {
        $lookup: {
          from: "likes",
          localField: "_id",
          foreignField: "tweet_id",
          as: "likes"
        }
      },

      // bookmarks
      {
        $lookup: {
          from: "bookmarks",
          localField: "_id",
          foreignField: "tweet_id",
          as: "bookmarks"
        }
      },

      // children tweets
      {
        $lookup: {
          from: "tweets",
          localField: "_id",
          foreignField: "parent_id",
          as: "tweet_children"
        }
      },

      {
        $addFields: {

          bookmarks: { $size: "$bookmarks" },

          likes: { $size: "$likes" },

          retweet_count: {
            $size: {
              $filter: {
                input: "$tweet_children",
                as: "item",
                cond: {
                  $eq: ["$$item.type", TweetType.Retweet]
                }
              }
            }
          },

          comment_count: {
            $size: {
              $filter: {
                input: "$tweet_children",
                as: "item",
                cond: {
                  $eq: ["$$item.type", TweetType.Comment]
                }
              }
            }
          },

          quote_count: {
            $size: {
              $filter: {
                input: "$tweet_children",
                as: "item",
                cond: {
                  $eq: ["$$item.type", TweetType.QuoteTweet]
                }
              }
            }
          }

        }
      },

      {
        $project: {
          tweet_children: 0,
          "user.password": 0,
          "user.email_verify_token": 0,
          "user.forgot_password_token": 0,
          "user.twitter_circle": 0,
          "user.date_of_birth": 0
        }
      }

    ]

    const countPipeline = [
      matchStage,
      { $count: "total" }
    ]

    const [tweets, totalResult] = await Promise.all([
      databaseService.tweets.aggregate(pipeline).toArray(),
      databaseService.tweets.aggregate(countPipeline).toArray()
    ])

    const total = totalResult[0]?.total || 0

    // update views
    const tweet_ids = tweets.map(t => t._id as ObjectId)

    if (tweet_ids.length) {
      const date = new Date()

      await databaseService.tweets.updateMany(
        { _id: { $in: tweet_ids } },
        {
          $inc: { user_views: 1 },
          $set: { updated_at: date }
        }
      )

      tweets.forEach(tweet => {
        tweet.updated_at = date
        tweet.user_views += 1
      })
    }

    return {
      tweets,
      total,
      page,
      limit
    }
  }
}
const searchService = new SearchService()
export default searchService