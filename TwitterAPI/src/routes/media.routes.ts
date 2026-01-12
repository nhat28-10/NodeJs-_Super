import { Router } from "express";
import { uploadSingleImageController } from "~/controllers/medias.controller";
import { warpRequestHandler } from "~/utils/handlers";

const mediasRouter = Router()
mediasRouter.post('/upload-image', warpRequestHandler(uploadSingleImageController))
export default mediasRouter