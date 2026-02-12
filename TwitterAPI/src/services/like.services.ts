import Like from "~/models/schemas/Bookmark.schemas"
import databaseService from "./database.services"
import { ObjectId } from "mongodb"

class LikeService {
  async likeTweet(user_id:string,tweetId: string) {
    const result = await databaseService.likes.findOneAndUpdate(
      {user_id:new ObjectId(user_id),tweet_id:new ObjectId(tweetId)},
      {$setOnInsert: new Like({
        user_id: new ObjectId(user_id),
        tweet_id: new ObjectId(tweetId),
      })},
      {
        upsert:true,
        returnDocument: 'after'
      }
    )
    return result
  }
  async unlikeTweet(user_id:string,tweetId: string) {
    const result = await databaseService.likes.findOneAndDelete(
      {user_id:new ObjectId(user_id),tweet_id:new ObjectId(tweetId)}
    )
    return result
  }
}
const likeService = new LikeService()
export default likeService