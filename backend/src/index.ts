import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import routing from './routes/routing'
import connect from './dbConnect/dbConnect'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3000

// CORS ABIERTO - PERMITE TODOS LOS ORÍGENES
app.use(
  cors({
    origin: true, // permite todos los orígenes
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
)

// Maneja las peticiones OPTIONS para cualquier ruta - muy importante para CORS
app.options('*', cors())

app.use(express.json())

connect()
routing(app)

const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port: ${PORT}`)
})
