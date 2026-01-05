
import { check, checkSchema, ParamSchema } from 'express-validator'
import { JsonWebTokenError } from 'jsonwebtoken'
import HTTP_STATUS from '~/constants/httpStatus'
import { USER_MESSAGE } from '~/constants/messages'
import { ErrorWithStatus } from '~/models/Errors'
import databaseService from '~/services/database.services'
import usersService from '~/services/users.service'
import { verifyToken } from '~/utils/jwt'
import { validate } from '~/utils/valdations'
import { capitalize } from 'lodash'
import { ObjectId } from 'mongodb'
import { NextFunction, RequestHandler } from 'express'
import { TokenPayload } from '~/models/requests/users.requests'
import { UserVerifyStatus } from '~/constants/enum'

const passwordSchema: ParamSchema = {
  notEmpty: {
    errorMessage: USER_MESSAGE.PASSWORD_IS_REQUIRED
  },
  isString: {
    errorMessage: USER_MESSAGE.PASSWORD_MUST_BE_STRING
  },
  isLength: {
    options: {
      min: 6,
      max: 50
    },
    errorMessage: USER_MESSAGE.PASSWORD_MUSTBE_AT_LEAST_6_CHARACTERS
  },
  isStrongPassword: {
    options: {
      minLength: 6,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1
    },
    errorMessage: USER_MESSAGE.PASSWORD_MUST_BE_STRONG
  }
}
const confirmPasswordSchema: ParamSchema = {
  notEmpty: {
    errorMessage: USER_MESSAGE.CONFIRM_PASSWORD_IS_REQUIRED
  },
  isString: {
    errorMessage: USER_MESSAGE.CONFIRM_PASSWORD_MUST_BE_STRING
  },
  isLength: {
    options: {
      min: 6,
      max: 50
    },
    errorMessage: USER_MESSAGE.CONFIRM_PASSWORD_MUSTBE_AT_LEAST_6_CHARACTERS
  },
  isStrongPassword: {
    options: {
      minLength: 6,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1
    },
    errorMessage: USER_MESSAGE.CONFIRM_PASSWORD_MUST_BE_STRONG
  },
  custom: {
    options: (value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Password confirmation doesnt match with password')
      }
      return true
    }
  }
}
const forgotPasswordTokenSchema: ParamSchema = {
  trim: true,
  custom: {
    options: async (value: string, { req }) => {
      if (!value) {
        throw new ErrorWithStatus({
          message: USER_MESSAGE.FORGOT_PASSWORD_TOKEN_IS_REQUIRED,
          status: HTTP_STATUS.UNAUTHORIZED
        })
      }
      try {
        const decoded_forgot_password_token = await verifyToken({
          token: value,
          secretOrPublicKey: process.env.JWT_SECRET_FORGOT_PASSWORD_TOKEN as string
        })
        const { user_id } = decoded_forgot_password_token
        const user = await databaseService.users.findOne({ _id: new ObjectId(user_id) })
        if (user === null) {
          throw new ErrorWithStatus({
            message: USER_MESSAGE.USER_NOT_FOUND,
            status: HTTP_STATUS.UNAUTHORIZED
          })
        }
        if (user.forgot_password_token !== value) {
          throw new ErrorWithStatus({
            message: USER_MESSAGE.FORGOT_PASSWORD_TOKEN_IS_INVALID,
            status: HTTP_STATUS.UNAUTHORIZED
          })
        }
        req.decoded_forgot_password_token = decoded_forgot_password_token
      } catch (error) {
        // ✅ NẾU LÀ ErrorWithStatus → NÉM LẠI
        if (error instanceof JsonWebTokenError) {
          throw new ErrorWithStatus({
            message: capitalize(error.message),
            status: HTTP_STATUS.UNAUTHORIZED
          })
        }
        throw error
      }
      return true
    }
  }
}
const nameSchema: ParamSchema = {
  notEmpty: {
    errorMessage: USER_MESSAGE.NAME_IS_REQUIRED
  },
  isString: {
    errorMessage: USER_MESSAGE.NAME_MUST_BE_STRING
  },
  isLength: {
    options: {
      min: 1,
      max: 100
    }
  },
  trim: true
}

const dateOfBirthSchema: ParamSchema = {
  optional: true,
  isISO8601: {
    options: {
      strict: true,
      strictSeparator: true
    },
    errorMessage: USER_MESSAGE.DATE_OF_BIRTH_IS_ISO8601
  }
}
const imageSchema: ParamSchema = {
      
      optional: true,
      isString: {
        errorMessage: USER_MESSAGE.IMAGE_MUST_BE_A_STRING
      },
      trim: true,
      isLength: {
        options: {
          min: 1,
          max: 400
        },
        errorMessage: USER_MESSAGE.IMAGE_LENGTH_MUST_BE_1_TO_400
      }
}
export const loginValidator = validate(
  checkSchema({
    email: {
      isEmail: {
        errorMessage: USER_MESSAGE.EMAIL_IS_INVALID
      },
      trim: true,
      custom: {
        options: async (value, { req }) => {
          const user = await databaseService.users.findOne({ email: value })
          if (user === null) {
            throw new Error(USER_MESSAGE.USER_NOT_FOUND)
          }
          req.user = user
          return true
        }
      }
    },
    password: {
      notEmpty: {
        errorMessage: USER_MESSAGE.PASSWORD_IS_REQUIRED
      },
      isString: {
        errorMessage: USER_MESSAGE.PASSWORD_MUST_BE_STRING
      },
      isLength: {
        options: {
          min: 6,
          max: 50
        },
        errorMessage: USER_MESSAGE.PASSWORD_MUSTBE_AT_LEAST_6_CHARACTERS
      },
      isStrongPassword: {
        options: {
          minLength: 6,
          minLowercase: 1,
          minUppercase: 1,
          minNumbers: 1
        },
        errorMessage: USER_MESSAGE.PASSWORD_MUST_BE_STRONG
      }
    }
  }, ['body'])
)

export const registerValidator = validate(
  checkSchema({
    name: nameSchema,
    email: {
      notEmpty: {
        errorMessage: USER_MESSAGE.EMAIL_IS_REQUIRED
      },
      isEmail: {
        errorMessage: USER_MESSAGE.EMAIL_IS_INVALID
      },
      trim: true,
      custom: {
        options: async (value) => {
          const isEmailExist = await usersService.checkEmailExists(value)
          if (isEmailExist) {
            throw new Error(USER_MESSAGE.EMAIL_ALREADY_EXISTS)
          }
          return true
        }
      }
    },
    password: passwordSchema,
    confirm_password: confirmPasswordSchema,
    date_of_birth: dateOfBirthSchema
  }, ['body'])
)
export const accessTokenValidator = validate(
  checkSchema({
    authorization: {
      trim: true,
      custom: {
        options: async (value: string, { req }) => {
          const access_token = (value || '').split(' ')[1]
          if (!access_token) {
            throw new ErrorWithStatus({ message: USER_MESSAGE.ACCESS_TOKEN_IS_REQUIRED, status: HTTP_STATUS.UNAUTHORIZED })
          }
          try {
            const decoded_authorization = await verifyToken({ token: access_token, secretOrPublicKey: process.env.JWT_SECRET_ACCESS_TOKEN as string });
            req.decoded_authorization = decoded_authorization
          } catch (error) {
            throw new ErrorWithStatus({
              message: capitalize((error as JsonWebTokenError).message),
              status: HTTP_STATUS.UNAUTHORIZED
            })
          }
          return true
        }
      }
    }
  }, ['headers'])
)
export const refreshTokenValidator = validate(
  checkSchema({
    refresh_token: {
      trim: true,
      custom: {
        options: async (value: string, { req }) => {
          if (!value) {
            throw new ErrorWithStatus({
              message: USER_MESSAGE.REFRESH_TOKEN_IS_REQUIRED,
              status: HTTP_STATUS.UNAUTHORIZED
            })
          }
          try {
            const [decoded_refresh_token, refresh_token] = await Promise.all([
              verifyToken({ token: value, secretOrPublicKey: process.env.JWT_SECRET_REFRESH_TOKEN as string }),
              databaseService.refreshTokens.findOne({ token: value })
            ])

            if (refresh_token === null) {
              throw new ErrorWithStatus({
                message: USER_MESSAGE.USED_REFRESH_TOKEN_OR_NOT_EXIST,
                status: HTTP_STATUS.UNAUTHORIZED
              })
            }

            req.decoded_refresh_token = decoded_refresh_token
            return true
          } catch (error) {
            // ✅ NẾU LÀ ErrorWithStatus → NÉM LẠI
            if (error instanceof JsonWebTokenError) {
              throw new ErrorWithStatus({
                message: capitalize(error.message),
                status: HTTP_STATUS.UNAUTHORIZED
              })
            }
            throw error
          }
        }
      }

    }
  }, ['body'])
)

export const emailTokenValidator = validate(
  checkSchema(
    {
      email_verify_token: {
        trim: true,
        custom: {
          options: async (value: string, { req }) => {
            if (!value) {
              throw new ErrorWithStatus({
                message: USER_MESSAGE.EMAIL_VERIFY_TOKEN_IS_REQUIRED,
                status: HTTP_STATUS.UNAUTHORIZED
              })
            }
            try {
              const decoded_email_verify_token = await verifyToken({
                token: value,
                secretOrPublicKey: process.env.JWT_SECRET_EMAIL_VERIFY_TOKEN as string
              })

              req.decoded_email_verify_token = decoded_email_verify_token

            } catch (error) {
              throw new ErrorWithStatus({
                message: capitalize((error as JsonWebTokenError).message),
                status: HTTP_STATUS.UNAUTHORIZED
              })
            }

            return true
          }
        }
      }
    },
    ['body']
  )
)

export const forgotPasswordValidator = validate(
  checkSchema({
    email: {
      isEmail: {
        errorMessage: USER_MESSAGE.EMAIL_IS_INVALID
      },
      trim: true,
      custom: {
        options: async (value, { req }) => {
          const user = await databaseService.users.findOne({ email: value })
          if (user === null) {
            throw new Error(USER_MESSAGE.USER_NOT_FOUND)
          }
          req.user = user
          return true
        }
      }
    },
  })
)
export const verifyForgotPasswordTokenValidator = validate(
  checkSchema({
    forgot_password_token: forgotPasswordTokenSchema
  }, ['body'])
)

export const resetPasswordValidator = validate(
  checkSchema({
    password: passwordSchema,
    confirm_password: confirmPasswordSchema,
    forgot_password_token: forgotPasswordTokenSchema
  }, ['body'])
)

export const verifiedUserValidator: RequestHandler = (req, res, next) => {
  const { verify } = req.decoded_authorization as TokenPayload
  if (verify !== UserVerifyStatus.Verified) {
    return next(new ErrorWithStatus({
      message: USER_MESSAGE.USER_NOT_VERIFIED,
      status: HTTP_STATUS.FORBIDDEN
    }))
  }
  next()
}

export const updateProfileValidator = validate(
  checkSchema({
    name: {
      ...nameSchema,
      optional: true,
      notEmpty: undefined
    },
    date_of_birth: {
      ...dateOfBirthSchema,
      optional: true,
    },
    bio: {
      
      optional: true,
      isString: {
        errorMessage: USER_MESSAGE.BIO_MUST_BE_A_STRING
      },
       trim: true,
      isLength: {
        options: {
          min: 1,
          max: 200
        },
        errorMessage: USER_MESSAGE.BIO_LENGTH_MUST_BE_1_TO_200
      },
    },
    location: {
      
      optional: true,
      isString: {
        errorMessage: USER_MESSAGE.LOCATION_MUST_BE_A_STRING
      },
      trim: true,
      isLength: {
        options: {
          min: 1,
          max: 200
        },
        errorMessage: USER_MESSAGE.LOCATION_LENGTH_MUST_BE_1_TO_200
      }
    },
    website:{
      
      optional: true,
      isString: {
        errorMessage: USER_MESSAGE.WEBSITE_MUST_BE_A_STRING
      },
      trim: true,
      isLength: {
        options: {
          min: 1,
          max: 200
        },
        errorMessage: USER_MESSAGE.WEBSITE_LENGTH_MUST_BE_1_TO_200
      }
    },
    username:{
     
      optional: true,
      isString: {
        errorMessage: USER_MESSAGE.USERNAME_MUST_BE_A_STRING
      },
      trim: true,
      isLength: {
        options: {
          min: 1,
          max: 50
        },
        errorMessage: USER_MESSAGE.USERNAME_LENGTH_MUST_BE_1_TO_50
      }
    },
    avatar: imageSchema,
    cover_photo:imageSchema
  }, ['body'])
)
