import { Request, Response, NextFunction } from 'express'
import { checkSchema } from 'express-validator'
import { validate } from '~/utils/valdations'
export const loginValidator = (req: Request, res: Response, next: NextFunction) => {
  const { email, password } = req.body
  if (!email || !password) {
    return res.status(400).json({
      error: 'Missing email or password'
    })
  }
  next()
}

export const registerValidator = validate(
  checkSchema({
    name: {
      notEmpty: true,
      isString: true,
      isLength: {
        options: {
          min: 1,
          max: 100
        }
      },
      trim: true
    },
    email: {
      notEmpty: true,
      isEmail: true,
      trim: true
    },
    password: {
      notEmpty: true,
      isString: true,
      isLength: {
        options: {
          min: 6,
          max: 50
        }
      },
      isStrongPassword: {
        options: {
          minLength: 6,
          minLowercase: 1,
          minUppercase: 1,
          minNumbers: 1
        }
      }
    },
    confirm_password: {
      notEmpty: true,
      isString: true,
      isLength: {
        options: {
          min: 6,
          max: 50
        }
      },
      isStrongPassword: {
        options: {
          minLength: 6,
          minLowercase: 1,
          minUppercase: 1,
          minNumbers: 1
        }
      },
      custom: {
        options: (value, { req }) => {
          if (value !== req.body.password) {
            throw new Error('Password confirmation doesnt match with password')
          }
        }
      }
    },
    date_of_birth: {
      optional: true,
      isISO8601: {
        options: {
          strict: true,
          strictSeparator: true
        }
      }
    }
  })
)
