import { NextFunction, Request, Response } from "express";
import { checkSchema } from "express-validator";
import { has, isEmpty } from "lodash";
import { ObjectId } from "mongodb";
import { MediaType, TweetAudience, TweetType, UserVerifyStatus } from "~/constants/enum";
import HTTP_STATUS from "~/constants/httpStatus";
import { TWEET_MGS, USER_MESSAGE } from "~/constants/messages";
import { ErrorWithStatus } from "~/models/Errors";
import Tweet from "~/models/schemas/Tweet.schema";
import databaseService from "~/services/database.services";
import { numberEnumToArray } from "~/utils/common";
import { warpRequestHandler } from "~/utils/handlers";
import { validate } from "~/utils/valdations";

const tweetTypes = numberEnumToArray(TweetType)
const tweetAudience = numberEnumToArray(TweetAudience)
const mediaType = numberEnumToArray(MediaType)
export const createTweetValidator = validate(
  checkSchema({
    type: {
      isIn: {
        options: [tweetTypes],
        errorMessage: TWEET_MGS.INVALID_TYPE
      }
    },
    audience: {
      isIn: {
        options: [tweetAudience],
        errorMessage: TWEET_MGS.INVALID_AUDIENCE
      }
    },
    parent_id : {
      custom: {
        options: (value, {req}) => {
          const type = req.body.type as TweetType
          if([TweetType.Retweet, TweetType.Comment, TweetType.QuoteTweet].includes(type) && ObjectId.isValid(value)) {
            throw new Error(TWEET_MGS.PARENT_ID)
          }
          if (type == TweetType.Tweet && value != null) {
            throw new Error(TWEET_MGS.PARENT_ID_NULL)
          }
          return true
        }
      }
    },
    content : {
      isString: true,
      custom: {
        options: (value, {req}) => {
          const type = req.body.type as TweetType
          const hashtags = req.body.hashtags as string[]
          const mentions = req.body.mentions as string[]
          if([TweetType.Tweet, TweetType.Comment, TweetType.QuoteTweet].includes(type) 
            && isEmpty(hashtags) && isEmpty(mentions) && (!value || value.trim() === '')) {
            throw new Error(TWEET_MGS.CONTENT_MUST_BE_A_NON_EMPTY_STRING)
          }
          if (type == TweetType.Retweet && value !== '') {
            throw new Error(TWEET_MGS.CONTENT_MUST_BE_EMPTY_STRING)
          }
          return true
        }
      }
    },
    hashtags: {
      isArray:true,
      custom: {
        options:(value) => {
          if(value.some((item: any)=> typeof item !== "string")) {
            throw new Error(TWEET_MGS.HASHTAGS_MUST_BE_ARRAY_STRING)
          }
          return true
        }
      }
    },
    mentions: {
      isArray:true,
      custom: {
        options:(value, {req}) => {
          if(value.some((item: any) => !ObjectId.isValid(item))) {
            throw new Error(TWEET_MGS.MENTIONS_MUST_BE_AN_ARRAY_OF_USERID)
          }
          return true
        }
      }
    },
    medias: {
      isArray:true,
      custom: {
        options: (value, {req}) => {
          if(value.some((item: any) => {
            return typeof item.url != 'string' || !mediaType.includes(item.type)
          })) {
            throw new Error(TWEET_MGS.MEDIA_MUST_BE_AN_ARRAY_OF_MEDIA_OBJECT)
          }
          return true
        }
      }
    }
  })
)

export const tweetIdValidator = validate(
  checkSchema({
    tweet_id: {
      custom:{
        options:async (value,{req}) => {
          if(!ObjectId.isValid(value)) {
            throw new ErrorWithStatus({
              status:HTTP_STATUS.BAD_REQUEST,
              message: TWEET_MGS.INVALID_TWEET_ID
            })
          }
          const tweet = await databaseService.tweets.findOne({
            _id: new ObjectId(value)
          })
          if(!tweet) {
            throw new ErrorWithStatus({
              status:HTTP_STATUS.NOT_FOUND,
              message: TWEET_MGS.TWEET_NOT_FOUND })
          }
          (req as Request).tweet = tweet
          return true
        }
      }
    }
},['params','body']))

export const audienceValidator = warpRequestHandler(async (req:Request, res:Response, next: NextFunction) => {
  const tweet = req.tweet as Tweet
  if(tweet.audience == TweetAudience.TweetCircle) {
    // Check if user watch tweet has logged in ?
    if(!req.decoded_authorization) {
      throw new ErrorWithStatus({
        status:HTTP_STATUS.UNAUTHORIZED,
        message: USER_MESSAGE.ACCESS_TOKEN_IS_REQUIRED
      })
    }
    // Check user author account status
    const author = await databaseService.users.findOne({
      _id: new ObjectId(tweet.user_id)
    }) 
    if(!author || author.verify == UserVerifyStatus.Banned) {
      throw new ErrorWithStatus({
        status:HTTP_STATUS.NOT_FOUND,
        message:USER_MESSAGE.USER_NOT_FOUND
      })
    }
    // Kiểm tra người xem tweet có nằm trong Tweet Circle hay không
    const { user_id } = req.decoded_authorization
    const viewerId = new ObjectId(user_id)

    const isAuthor = author._id.equals(viewerId)
    const isInTweetCircle = author.twitter_circle.some((id: any) => new ObjectId(id).equals(viewerId))
    if( !isAuthor && !isInTweetCircle) {
      throw new ErrorWithStatus({
        status:HTTP_STATUS.FORBIDDEN,
        message:TWEET_MGS.TWEET_IS_NOT_PUBLIC
      })
    }
  }
  
  next()
})

