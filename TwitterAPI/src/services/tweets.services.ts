import { TweetReqBody } from "~/models/requests/tweets.request";
import databaseService from "./database.services";
import { ObjectId, WithId } from "mongodb";
import Tweet from "~/models/schemas/Tweet.schema";
import Hashtag from "~/models/schemas/Hashtags.schemas";


class TweetServices {
  async checkAndCreateHashtag(hashtags: string[]) {
  const results = await Promise.all(
    hashtags.map((name) =>
      databaseService.hashtags.findOneAndUpdate(
        { name },
        { $setOnInsert: new Hashtag({ name }) },
        { upsert: true, returnDocument: "after",includeResultMetadata: true }
      )
    )
  );

  return results.map((res) => {
    if (!res.value) throw new Error("Hashtag upsert failed");
    return (res.value as WithId<Hashtag>)._id;
  });
}
  async createTweet(user_id:string,body: TweetReqBody) {
    const hashtags = await this.checkAndCreateHashtag(body.hashtags)
    const result = await databaseService.tweets.insertOne(new Tweet({
      audience: body.audience,
      content: body.content,
      hashtags,
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