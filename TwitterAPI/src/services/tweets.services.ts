import { TweetReqBody } from "~/models/requests/tweets.request";
import databaseService from "./database.services";
import { ObjectId } from "mongodb";
import Tweet from "~/models/schemas/Tweet.schema";

class TweetServices {
  async createTweet(user_id:string,body: TweetReqBody) {
    const result = await databaseService.tweets.insertOne(new Tweet({
      audience: body.audience,
      content: body.content,
      hashtags: [],
      mentions:body.mentions,
      medias: body.medias,
      parent_id: body.parent_id,
      type: body.type,
      user_id: new ObjectId(user_id)
    }))
    const tweet = await databaseService.tweets.findOne({_id: result.insertedId})
    return tweet;
  }
}

const tweetServices = new TweetServices();
export default tweetServices