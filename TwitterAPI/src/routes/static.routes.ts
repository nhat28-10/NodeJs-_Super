import { Router } from "express";
import { stat } from "fs";
import { serveImageController, serveM3U8Controller,  serveSegmentController,  serveVideoStreamController } from "~/controllers/medias.controller";

const staticRouter = Router()

staticRouter.get('/image/:name',serveImageController)
staticRouter.get('/video-stream/:name', serveVideoStreamController)
staticRouter.get('/video-hls/:id/master.m3u8',serveM3U8Controller)
staticRouter.get('/video-hls/:id/:v/:segment',serveSegmentController)
export default staticRouter