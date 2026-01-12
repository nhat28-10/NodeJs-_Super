import { Request } from "express"
import sharp from "sharp"
import { UPLOAD_DIR } from "~/constants/dir"
import { getNameFromFullName, handleUploadSingleImage } from "~/utils/file"
import path from "path"
import fs from 'fs'

class MediasSerivce {
  async handleUploadSingleImage(req: Request) {
    const file = await handleUploadSingleImage(req)
    const newName = getNameFromFullName(file.newFilename)
    const newPath = path.resolve(UPLOAD_DIR, `${newName}.jpg`)
    console.log(newPath)
     await sharp(file.filepath).jpeg().toFile(newPath)
     fs.unlinkSync(file.filepath)
    return `http://localhost:3000/uploads/${newName}.jpg`
  }
}

const mediasService = new MediasSerivce()
export default mediasService