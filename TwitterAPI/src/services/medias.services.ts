import { Request } from "express"
import sharp from "sharp"
import { UPLOAD_DIR, UPLOAD_TEMP_DIR, UPLOAD_VIDEO_DIR } from "~/constants/dir"
import { getNameFromFullName, handleUploadImage, handleUploadVideo } from "~/utils/file"
import path from "path"
import fs from 'fs'
import { promises as fsPromise } from 'fs'
import { isProduction } from "~/constants/config"
import { config } from "dotenv"
import { EncodingStatus, MediaType } from "~/constants/enum"
import { Media } from "~/models/Other"
import { encodeHLSWithMultipleVideoStreams } from "~/utils/video"
import databaseService from "./database.services"
import VideoStatus from "~/models/schemas/VideoStatus.schemas"
config()
class Queue {
  items: string[]
  encoding: boolean
  constructor() {
    this.items = []
    this.encoding = false
  }
  async enqueue(item: string) {
    this.items.push(item)
    const idName = getNameFromFullName(item.split(/[/\\]/).pop() as string)
    await databaseService.videoStatus.insertOne(new VideoStatus({
      name: idName,
      status: EncodingStatus.Pending
    }))
    this.processEncode()
  }
  async processEncode() {
  if (this.encoding) return
  if (this.items.length === 0) return

  this.encoding = true
  const videoPath = this.items[0]
  const idName = getNameFromFullName(videoPath.split(/[/\\]/).pop() as string)

  try {
    await databaseService.videoStatus.updateOne(
      { name: idName },
      { $set: { status: EncodingStatus.Processing }, $currentDate: { updated_at: true } }
    )

    await encodeHLSWithMultipleVideoStreams(videoPath)

    this.items.shift()
    await fsPromise.unlink(videoPath)

    await databaseService.videoStatus.updateOne(
      { name: idName },
      { $set: { status: EncodingStatus.Success }, $currentDate: { updated_at: true } }
    )
  } catch (error) {
    await databaseService.videoStatus.updateOne(
      { name: idName },
      { $set: { status: EncodingStatus.Failed }, $currentDate: { updated_at: true } }
    ).catch(() => {})
    console.error(error)
  } finally {
    this.encoding = false
    this.processEncode()
  }
}

}
const queue = new Queue()
class MediasSerivce {
  async handleUploadImage(req: Request) {
    const files = await handleUploadImage(req)
    const result: Media[] = await Promise.all(files.map(async file => {
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
    const { newFilename } = files[0]
    return {
      url: isProduction ?
        `${process.env.HOST}/static/video-stream/${newFilename}` :
        `http://localhost:${process.env.PORT}/static/video-stream/${newFilename}`,
      type: MediaType.Video
    }
  }
  async handleUploadVideoHLS(req: Request) {
    const files = await handleUploadVideo(req)
    const result: Media[] = await Promise.all(files.map(async (file) => {
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
  async getVideoStatus(id: string) {
   const data = await databaseService.videoStatus.findOne({name:id})
   return data
  }
}

const mediasService = new MediasSerivce
export default mediasService