import { Router } from "express";
import { uploadImageController, uploadVideoController} from "~/controllers/medias.controller";
import { warpRequestHandler } from "~/utils/handlers";

const mediasRouter = Router()
mediasRouter.post('/upload-image', warpRequestHandler(uploadImageController))
mediasRouter.post('/upload-video', warpRequestHandler(uploadVideoController))
export default mediasRouter