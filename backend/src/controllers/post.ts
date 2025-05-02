import { Request, Response, NextFunction } from 'express'
import Post from '../models/Post'

async function add(req: Request, res: Response, next: NextFunction) {
  const { description } = req.body
  const imageFile = req.file
  if (!description) {
    res.status(400).json({ message: 'Description is required' })
    return
  }

  if (!imageFile) {
    res.status(400).json({ message: 'No image uploaded' })
    return
  }

  try {
    const newPost = new Post({
      description,
      imageUrl: imageFile.buffer, // Guardamos el buffer de la imagen
    })

    await newPost.save()

    res.status(201).json({
      message: 'Post created successfully',
      ok: true,
    })
  } catch (err) {
    next(err)
  }
}

async function postsList(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await Post.find().exec()

    if (data) {
      res.status(200).json({
        ok: true,
        data,
      })
    }
  } catch (err) {
    next(err)
  }
}

export default { postsList, add }
