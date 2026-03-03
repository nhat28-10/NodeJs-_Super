import { TweetReqBody } from "~/models/requests/tweets.request";
import databaseService from "./database.services";
import { ObjectId, WithId } from "mongodb";
import Tweet from "~/models/schemas/Tweet.schema";
import Hashtag from "~/models/schemas/Hashtags.schemas";
import { TweetType } from "~/constants/enum";

type IncreaseViewResult = {
  guest_views: number
  user_views: number
}
class TweetServices {
  async checkAndCreateHashtag(hashtags: string[]) {
    const results = await Promise.all(
      hashtags.map((name) =>
        databaseService.hashtags.findOneAndUpdate(
          { name },
          { $setOnInsert: new Hashtag({ name }) },
          { upsert: true, returnDocument: "after", includeResultMetadata: true }
        )
      )
    );

    return results.map((res) => {
      if (!res.value) throw new Error("Hashtag upsert failed");
      return (res.value as WithId<Hashtag>)._id;
    });
  }
  async createTweet(user_id: string, body: TweetReqBody) {
    const hashtags = await this.checkAndCreateHashtag(body.hashtags)
    const result = await databaseService.tweets.insertOne(new Tweet({
      audience: body.audience,
      content: body.content,
      hashtags,
      mentions: body.mentions,
      medias: body.medias,
      parent_id: body.parent_id,
      type: body.type,
      user_id: new ObjectId(user_id)
    }))
    const tweet = await databaseService.tweets.findOne({ _id: result.insertedId })
    return tweet;
  }
  async increaseView(tweet_id: string, user_id?: string): Promise<IncreaseViewResult> {
    const inc = user_id ? { user_views: 1 } : { guest_views: 1 }

    const result = await databaseService.tweets.findOneAndUpdate(
      { _id: new ObjectId(tweet_id) },
      {
        $inc: inc
      },
      {
        returnDocument: 'after',
        projection: {
          _id: 0,
          guest_views: 1,
          user_views: 1
        }
      }
    )

    if (!result) {
      throw new Error('Tweet not found')
    }

    return {
      guest_views: result.guest_views ?? 0,
      user_views: result.user_views ?? 0
    }
  }
  async getTweetChildren({tweet_id,tweet_type,limit,page}
    : {tweet_id:string, tweet_type:TweetType, limit:number ,page:number}) {
    const tweets = await databaseService.tweets.aggregate<Tweet>(
      [
        {
          '$match': {
            'parent_id': new ObjectId(tweet_id),
            'type': tweet_type,
          }
        }, {
          '$lookup': {
            'from': 'hashtags',
            'localField': 'hashtags',
            'foreignField': '_id',
            'as': 'hashtags'
          }
        }, {
          '$lookup': {
            'from': 'users',
            'localField': 'mentions',
            'foreignField': '_id',
            'as': 'mentions'
          }
        }, {
          '$lookup': {
            'from': 'bookmarks',
            'localField': '_id',
            'foreignField': 'tweet_id',
            'as': 'bookmarks'
          }
        }, {
          '$lookup': {
            'from': 'likes',
            'localField': '_id',
            'foreignField': 'tweet_id',
            'as': 'likes'
          }
        }, {
          '$addFields': {
            'mentions': {
              '$map': {
                'input': '$mentions',
                'as': 'mention',
                'in': {
                  '_id': '$$mention._id',
                  'name': '$$mention.name',
                  'username': '$$mention.username',
                  'email': '$$mention.email'
                }
              }
            }
          }
        }, {
          '$lookup': {
            'from': 'tweets',
            'localField': '_id',
            'foreignField': 'parent_id',
            'as': 'tweet_children'
          }
        }, {
          '$addFields': {
            'bookmarks': {
              '$size': '$bookmarks'
            },
            'likes': {
              '$size': '$likes'
            },
            'retweet_count': {
              '$size': {
                '$filter': {
                  'input': '$tweet_children',
                  'as': 'item',
                  'cond': {
                    '$eq': [
                      '$$item.type', TweetType.Retweet
                    ]
                  }
                }
              }
            },
            'comment_count': {
              '$size': {
                '$filter': {
                  'input': '$tweet_children',
                  'as': 'item',
                  'cond': {
                    '$eq': [
                      '$$item.type', TweetType.Comment
                    ]
                  }
                }
              }
            },
            'quote_count': {
              '$size': {
                '$filter': {
                  'input': '$tweet_children',
                  'as': 'item',
                  'cond': {
                    '$eq': [
                      '$$item.type', TweetType.QuoteTweet
                    ]
                  }
                }
              }
            },
            'views': {
              '$add': [
                '$user_views', '$guest_views'
              ]
            }
          }
        }, {
          '$project': {
            'tweet_children': 0
          }
        }, {
          '$skip': limit * (page - 1)
        }, {
          '$limit': limit
        }
      ]
    ).toArray()
    const total = await databaseService.tweets.countDocuments({
      parent_id: new ObjectId(tweet_id),
      type: tweet_type
    })
    return {tweets, total}
  }
}

const tweetServices = new TweetServices();
export default tweetServices