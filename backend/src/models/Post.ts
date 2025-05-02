import mongoose from 'mongoose'

interface Post {
  description: string
  imageUrl: Buffer  // Almacenamos la imagen como un buffer en BD
}

const postSchema = new mongoose.Schema({
  description: { type: String, required: true },
  imageUrl: { type: Buffer, required: true }, 
})

export default mongoose.model('Post', postSchema)
