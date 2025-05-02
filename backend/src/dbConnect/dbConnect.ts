import mongoose from 'mongoose'
import dotenv from 'dotenv'

dotenv.config()
const URLDB = process.env.URLDB || ''

if (!URLDB) {
  throw new Error('URLDB no está definida en el archivo .env')
}

export default async function connect() {
  try {
    await mongoose.connect(URLDB)
    console.log('Conexion con DB realizada')
  } catch (err) {
    console.log(err)
  }
}
