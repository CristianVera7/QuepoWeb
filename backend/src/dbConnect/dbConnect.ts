import mongoose from 'mongoose'
import dotenv from 'dotenv'

dotenv.config()

const isDocker = process.env.IS_DOCKER === 'true'

// Garantiza que URLDB sea un string siempre
const URLDB: string = isDocker
  ? process.env.URLDB ?? ''
  : 'mongodb://localhost:27018/quepoDB'

if (!URLDB) {
  throw new Error('❌ URLDB no está definida')
}

export default async function connect(): Promise<void> {
  try {
    await mongoose.connect(URLDB)
    console.log(`✅ Conexión con DB realizada: ${URLDB}`)
  } catch (err) {
    console.error('❌ Error conectando a la DB:', err)
  }
}