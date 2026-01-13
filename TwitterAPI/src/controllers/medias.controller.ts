import { Request, Response, NextFunction } from "express"
import formidable from "formidable"
import path from "path"
import { UPLOAD_DIR } from "~/constants/dir"
import { USER_MESSAGE } from "~/constants/messages"
import mediasService from "~/services/medias.service"


export const uploadImageController = async (req:Request, res: Response, next: NextFunction) => {
  
  const url = await mediasService.handleUploadImage(req)
  return res.json({
    message:USER_MESSAGE.UPLOAD_IMAGE_SUCCESS,
    result :url
  })
}

export const serveImageController = (req:Request, res:Response, next:NextFunction) => {
  const {name} = req.params
  console.log(name)
  return res.sendFile(path.resolve(UPLOAD_DIR, name), (err) => {
    console.log(err)
    if(err) {
      res.status((err as any).status).send('Not found')
    }
  })
}