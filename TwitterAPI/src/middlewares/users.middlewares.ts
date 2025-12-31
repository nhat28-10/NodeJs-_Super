
import { check, checkSchema } from 'express-validator'
import HTTP_STATUS from '~/constants/httpStatus'
import { USER_MESSAGE } from '~/constants/messages'
import { ErrorWithStatus } from '~/models/Errors'
import databaseService from '~/services/database.services'
import usersService from '~/services/users.service'
import { verifyToken } from '~/utils/jwt'
import { validate } from '~/utils/valdations'
export const loginValidator = validate(
  checkSchema({
    email: {
      isEmail: {
        errorMessage: USER_MESSAGE.EMAIL_IS_INVALID
      },
      trim: true,
      custom: {
        options: async (value, {req}) => {
          const user = await databaseService.users.findOne({email: value})
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
        errorMessage:USER_MESSAGE.PASSWORD_MUST_BE_STRONG
      }
    }
  },['body'])
)

export const registerValidator = validate(
  checkSchema({
    name: {
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
    },
    email: {
      notEmpty: {
        errorMessage:USER_MESSAGE.EMAIL_IS_REQUIRED
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
        errorMessage:USER_MESSAGE.PASSWORD_MUST_BE_STRONG
      }
    },
    confirm_password: {
      notEmpty: {
        errorMessage:USER_MESSAGE.CONFIRM_PASSWORD_IS_REQUIRED
      },
      isString: {
        errorMessage:USER_MESSAGE.CONFIRM_PASSWORD_MUST_BE_STRING
      },
      isLength: {
        options: {
          min: 6,
          max: 50
        },
        errorMessage:USER_MESSAGE.CONFIRM_PASSWORD_MUSTBE_AT_LEAST_6_CHARACTERS
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
    },
    date_of_birth: {
      optional: true,
      isISO8601: {
        options: {
          strict: true,
          strictSeparator: true
        }, 
        errorMessage: USER_MESSAGE.DATE_OF_BIRTH_IS_ISO8601
      }
    }
  },['body'])
)
export const accessTokenValidator = validate(
  checkSchema({
    authorization:{
      notEmpty: {
        errorMessage: USER_MESSAGE.ACCESS_TOKEN_IS_REQUIRED
      },
      custom: {
        options: async (value: string, {req}) => {
          const access_token = value.split(' ')[1]
          if(!access_token ) {
            throw new ErrorWithStatus({message:USER_MESSAGE.ACCESS_TOKEN_IS_REQUIRED, status:HTTP_STATUS.UNAUTHORIZED})
          }
          const decoded_authorization = await verifyToken({token: access_token})
          req.decoded_authorization = decoded_authorization
          return true
        }
      }
    }
  },['headers'])
)
