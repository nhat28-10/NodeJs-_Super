import { Router } from "express";
import { uploadImageController, uploadVideoController} from "~/controllers/medias.controller";
import { accessTokenValidator, verifiedUserValidator } from "~/middlewares/users.middlewares";
import { warpRequestHandler } from "~/utils/handlers";

const mediasRouter = Router()
mediasRouter.post('/upload-image',accessTokenValidator,verifiedUserValidator, warpRequestHandler(uploadImageController))
mediasRouter.post('/upload-video',accessTokenValidator,verifiedUserValidator, warpRequestHandler(uploadVideoController))
export default mediasRouter