import fs from 'fs'
import path, { resolve } from 'path'
import { Request } from 'express'
import { File } from 'formidable'
import { UPLOAD_TEMP_DIR, UPLOAD_VIDEO_DIR } from '~/constants/dir'
import { nanoid } from 'nanoid'


const UPLOAD_FOLDER = path.resolve('uploads/temp')
export const initFolder = () => {
  if (!fs.existsSync(UPLOAD_TEMP_DIR)) {
    fs.mkdirSync(UPLOAD_TEMP_DIR, {
      recursive: true // mục đích là để tạo folder nested
    })
  }
  if (!fs.existsSync(UPLOAD_VIDEO_DIR)) {
    fs.mkdirSync(UPLOAD_VIDEO_DIR, {
      recursive: true
    })
  }
}

export const handleUploadImage = async (req: Request) => {
  const formidable = (await import('formidable')).default
  const form = formidable({
    uploadDir: UPLOAD_TEMP_DIR,
    maxFiles: 4,
    keepExtensions: true,
    maxFileSize: 1000 * 1024,
    maxTotalFileSize: 1000 * 1024 * 4,
    filter: function({name,originalFilename,mimetype}) {
      const valid = name == 'image' && Boolean(mimetype?.includes('image/'))
      if(!valid) {
        form.emit('error' as any, new Error('File type is not valid') as any)
      }
      return true
    }
  })
  return new Promise<File[]>((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) {
        return reject(err)
      }
      // eslint-disable-next-line no-extra-boolean-cast
      if(!Boolean(files.image)) {
        return reject(new Error('File is not empty'))
      }
      resolve(files.image as File[])
    })
  })
}
export const getNameFromFullName = (fullname:string) => {
  const namearr = fullname.split('.')
  namearr.pop()
  return namearr.join('')
}
export const handleUploadVideo = async (req: Request) => {
  const formidable = (await import('formidable')).default
  const nanoId = (await import('nanoid')).nanoid
  const idName = nanoId()
  const folderPath = path.resolve(UPLOAD_VIDEO_DIR, idName)
  fs.mkdirSync(folderPath)
  const form = formidable({
    uploadDir: folderPath,
    maxFiles: 1,
    maxFileSize: 50 * 1024 * 1024,
    filter: function ({ name, originalFilename, mimetype }) {
      const valid =
        name == 'video' &&
        Boolean(
          mimetype?.includes('mp4') ||
          mimetype?.includes('quicktime')
        )

      if (!valid) {
        form.emit('error' as any, new Error('File type is not valid') as any)
      }
      return valid
    },
    filename: function() {
      return idName
    }
  })

  return new Promise<File[]>((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) {
        return reject(err)
      }

      // eslint-disable-next-line no-extra-boolean-cast
      if (!Boolean(files.video)) {
        return reject(new Error('File is empty'))
      }

      const videos = files.video as File[]

      videos.forEach((video) => {
        const ext = getExtension(video.originalFilename as string)
        fs.renameSync(video.filepath, video.filepath + '.' + ext)
        video.newFilename = video.newFilename + '.' + ext
        video.filepath = video.filepath + '.' + ext
      })

      resolve(files.video as File[])
    })
  })
}


export const getExtension = (fullname:string) => {
  const namearr = fullname.split('.')
  return namearr[namearr.length - 1]
}