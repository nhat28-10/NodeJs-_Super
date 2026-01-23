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
class Queue {
  items: string[]
  encoding: boolean
  constructor() {
    this.items = []
    this.encoding = false
  }
  enqueue(item: string) {
    this.items.push(item)
    this.processEncode()
  }
  async processEncode() {
    if(this.encoding) return
    if(this.items.length > 0) {
      this.encoding = true
      const videoPath = this.items[0]
      try {
         await encodeHLSWithMultipleVideoStreams(videoPath)
         this.items.shift()
         await fsPromise.unlink(videoPath)
         console.log(`Encode video ${videoPath} success`)
      } catch (error) {
        console.error(`Encode video ${videoPath} error`)
        console.error(error)
      }
      this.encoding = false
      this.processEncode()
    } else {
      console.log(`Encode video queue is empty`)
    }
  }
}
const queue = new Queue()
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
      const newName = getNameFromFullName(file.newFilename)
      queue.enqueue(file.filepath)
      return {
        url: isProduction ?
          `${process.env.HOST}/static/video-hls/${newName}.m3u8` :
          `http://localhost:${process.env.PORT}/static/video-hls/${newName}.m3u8`,
        type: MediaType.HLS
      }
    }))
    return result
  }
}

const mediasService = new MediasSerivce
export default mediasService