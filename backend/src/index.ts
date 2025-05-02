import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import routing from './routes/routing'
import connect from './dbConnect/dbConnect'
import fileUpload from 'express-fileupload'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3000

// Permitir múltiples orígenes
const allowedOrigins = [
  'http://localhost:5174',
  'https://0pxkvm6c-5174.uks1.devtunnels.ms'
]

app.use(
  cors({
    origin: (origin, callback) => {
      // Verifica si el origen está permitido
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true)
      } else {
        callback(new Error('No permitido por CORS'))
      }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
)
app.use(express.json())

connect()
routing(app)

const server = app.listen(PORT, () => {
  console.log(`Server running on port: ${PORT}`)
})
