import express from 'express'
import { body, validationResult, ValidationChain} from 'express-validator'
import { RunnableValidationChains } from 'express-validator/lib/middlewares/schema'
import HTTP_STATUS from '~/constants/httpStatus'
import { EntityError, ErrorWithStatus } from '~/models/Errors'

// can be reused by many routes
export const validate = (validations: RunnableValidationChains<ValidationChain>) => {
  return async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    await validations.run(req)
    const errors = validationResult(req)
    // Nếu mà không có lỗi thì next
    if (errors.isEmpty()) {
      return next()
    }
    const errorsObject =  errors.mapped()
    const entityError = new EntityError({errors: {}})
    for (const key in errorsObject) {
      const {msg} = errorsObject[key]
      // Trả về lỗi không validate
      if ( msg instanceof ErrorWithStatus && msg.status !== HTTP_STATUS.UNPROGRESSABLE_ENTITY) {
        return next(msg)
      }
      entityError.errors[key] = msg
    }
    
    next(entityError)
  }
}
