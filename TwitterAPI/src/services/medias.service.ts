import { Request } from "express"
import sharp from "sharp"
import { UPLOAD_DIR } from "~/constants/dir"
import { getNameFromFullName, handleUploadImage } from "~/utils/file"
import path from "path"
import fs from 'fs'
import { isProduction } from "~/constants/config"
import { config } from "dotenv"
import { MediaType } from "~/constants/enum"
import { Media } from "~/models/Other"
config()
class MediasSerivce {
  async handleUploadImage(req: Request) {
    const files = await handleUploadImage(req)
    const result:Media[] = await Promise.all(files.map(async file => {
      const newName = getNameFromFullName(file.newFilename)
      const newPath = path.resolve(UPLOAD_DIR, `${newName}.jpg`)
      console.log(newPath)
      await sharp(file.filepath).jpeg().toFile(newPath)
      fs.unlinkSync(file.filepath)
      return {
        url: isProduction ?
          `${process.env.HOST}/static/${newName}.jpg` :
          `http://localhost:${process.env.PORT}/static/${newName}.jpg`,
        type: MediaType.Image
      }
    }))
    return result
  }
}

const mediasService = new MediasSerivce()
export default mediasService