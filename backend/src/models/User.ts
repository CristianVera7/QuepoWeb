import mongoose from 'mongoose'

const VALID_EMAIL = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/

export interface User {
  nickName: string
  email: string
  password: string
  dni?: string
}

const userSchema = new mongoose.Schema({
  //Hacer unico el nickName
  nickName: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, trim: true, match: VALID_EMAIL },
  password: { type: String, required: true, select: false },
  dni: { type: String, unique: true, trim: true, sparse: true, },
})

export default mongoose.model('User', userSchema)
