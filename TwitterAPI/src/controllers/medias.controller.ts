import { Request, Response, NextFunction } from "express"
import formidable from "formidable"
import path from "path"
import { USER_MESSAGE } from "~/constants/messages"
import mediasService from "~/services/medias.service"


export const uploadSingleImageController = async (req:Request, res: Response, next: NextFunction) => {
  
  const url = await mediasService.handleUploadSingleImage(req)
  return res.json({
    message:USER_MESSAGE.UPLOAD_IMAGE_SUCCESS,
    result :url
  })
}