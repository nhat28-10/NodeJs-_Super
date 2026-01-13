import { Router } from "express";
import { uploadImageController} from "~/controllers/medias.controller";
import { warpRequestHandler } from "~/utils/handlers";

const mediasRouter = Router()
mediasRouter.post('/upload-image', warpRequestHandler(uploadImageController))
export default mediasRouter