import { Request, Response, NextFunction } from "express"
import formidable from "formidable"
import fs from 'fs'
import { head } from "lodash"
import mime from "mime"
import path from "path"
import { UPLOAD_DIR, UPLOAD_VIDEO_DIR } from "~/constants/dir"
import HTTP_STATUS from "~/constants/httpStatus"
import { USER_MESSAGE } from "~/constants/messages"
import mediasService from "~/services/medias.services"

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
export const uploadVideoController = async (req:Request, res:Response, next:NextFunction) => {
  const url = await mediasService.handleUploadVideo(req)
  return res.json({
    message:USER_MESSAGE.UPLOAD_VIDEO_SUCCESS,
    result: url
  })
}
export const uploadVideoHLSController = async (req:Request, res:Response, next:NextFunction) => {
  const url = await mediasService.handleUploadVideoHLS(req)
  return res.json({
    message:USER_MESSAGE.UPLOAD_VIDEO_SUCCESS,
    result: url
  })
}
export const serveM3U8Controller = (req:Request, res:Response, next:NextFunction) => {
  const {id} = req.params
  return res.sendFile(path.resolve(UPLOAD_VIDEO_DIR, id, 'master.m3u8'), (err) => {
    console.log(err)
    if(err) {
      res.status((err as any).status).send('Not found')
    }
  })
}
export const serveSegmentController = (req:Request, res:Response, next:NextFunction) => {
  const {id,v,segment} = req.params
  console.log(segment)
  return res.sendFile(path.resolve(UPLOAD_VIDEO_DIR, id, v,segment), (err) => {
    console.log(err)
    if(err) {
      res.status((err as any).status).send('Not found')
    }
  })
}
export const serveVideoStreamController = (req:Request, res:Response, next:NextFunction) => {
  const range = req.headers.range
  if(!range) {
    return res.status(HTTP_STATUS.BAD_REQUEST).send('Require range header')
  }
  const {name} = req.params
  const videoPath = path.resolve(UPLOAD_VIDEO_DIR, name)
  // 1MB = 10^6 bytes (Tính theo hệ 10, đây là thứ chúng ta luôn thấy trên UI)
  if (!fs.existsSync(videoPath)) {
  return res.status(404).send('Video not found')
}
console.log('videoPath:', videoPath)
console.log('exists:', fs.existsSync(videoPath))
  // Dung lượng video (bytes)
  const videoSize = fs.statSync(videoPath).size
  // DUng lượng video cho mỗi phân đoạn stream có thể là load
  const chunkSize = 10 ** 6 // 1MB
  // Lấy giá trị byte bắt đầu từ header range
  const start = Number(range.replace(/\D/g, ''))
  // lấy giá trị byte kết thúc, vượt quá dung lượng video thì lấy videoSize
  const end = Math.min(start + chunkSize, videoSize - 1)
  // Dung lượng thực tế cho mỗi đoạn video stream thường sẽ là chunkSize ngoại trừ cuối cùng
  const contentLength = end - start + 1
  const contentType = mime.getType(videoPath) || 'video/*'
  const headers = {
    'Content-Range': `bytes ${start}-${end}/${videoSize}`,
    'Accept-Ranges': 'bytes',
    'Content-Length': contentLength,
    'Content-Type': contentType
  }
  res.writeHead(HTTP_STATUS.PARTICAL_CONTENT, headers)
  const videoSteams = fs.createReadStream(videoPath, {start, end})
  videoSteams.pipe(res)
}
export const videoStatusController = async (req:Request, res:Response,next:NextFunction)=> {
  const {id} = req.params
  const result = await mediasService.getVideoStatus(id as string)
  console.log(result)
  res.json({
    message:USER_MESSAGE.FETCH_VIDEO_STATUS_SUCCESS,
    result: result
  })
}
