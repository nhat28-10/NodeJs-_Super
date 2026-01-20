import { Request } from "express"
import sharp from "sharp"
import { UPLOAD_DIR, UPLOAD_TEMP_DIR, UPLOAD_VIDEO_DIR} from "~/constants/dir"
import { getNameFromFullName, handleUploadImage, handleUploadVideo } from "~/utils/file"
import path from "path"
import fs from 'fs'
import { promises as fsPromise } from 'fs'
import { isProduction } from "~/constants/config"
import { config } from "dotenv"
import { MediaType } from "~/constants/enum"
import { Media } from "~/models/Other"
import { encodeHLSWithMultipleVideoStreams } from "~/utils/video"
config()
class MediasSerivce {
  async handleUploadImage(req: Request) {
    const files = await handleUploadImage(req)
    const result:Media[] = await Promise.all(files.map(async file => {
      const newName = getNameFromFullName(file.newFilename)
      const newPath = path.resolve(UPLOAD_TEMP_DIR, `${newName}.jpg`)
      console.log(newPath)
      await sharp(file.filepath).jpeg().toFile(newPath)
      fs.unlinkSync(file.filepath)
      return {
        url: isProduction ?
          `${process.env.HOST}/static/image/${newName}` :
          `http://localhost:${process.env.PORT}/static/image/${newName}`,
        type: MediaType.Image
      }
    }))
    return result
  }
  async handleUploadVideo(req: Request) {
    const files = await handleUploadVideo(req)
    const {newFilename} = files[0]
     return {
        url: isProduction ?
          `${process.env.HOST}/static/video-stream/${newFilename}` :
          `http://localhost:${process.env.PORT}/static/video-stream/${newFilename}`,
        type: MediaType.Video
      }
  }
  async handleUploadVideoHLS(req:Request) {
    const files = await handleUploadVideo(req)
    const result: Media[] = await Promise.all(files.map(async(file) => {
      await encodeHLSWithMultipleVideoStreams(file.filepath)
      const newName = getNameFromFullName(file.newFilename)
      await fsPromise.unlink(file.filepath)
      return {
        url: isProduction ?
          `${process.env.HOST}/static/video-hls/${newName}` :
          `http://localhost:${process.env.PORT}/static/video-stream/${newName}`,
        type: MediaType.Video
      }
    }))
    return result
  }
}

const mediasService = new MediasSerivce
export default mediasService