import { Request, Response, NextFunction } from "express"
import formidable from "formidable"
import path from "path"
import mediasService from "~/services/medias.service"
import { handleUploadSingleImage } from "~/utils/file"

export const uploadSingleImageController = async (req:Request, res: Response, next: NextFunction) => {
  
  const result = await mediasService.handleUploadSingleImage(req)
  console.log(result)
  return res.json({
    result :result
  })
}