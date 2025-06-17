import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import routing from './routes/routing'
import connect from './dbConnect/dbConnect'

dotenv.config()

const app = express()
const DEFAULT_PORT = 3000
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : DEFAULT_PORT

app.use(
  cors({
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
)

app.options('*', cors())

app.use(express.json())

connect()
routing(app)

function startServer(portToTry: number) {
  const server = app.listen(portToTry, () => {
    console.log(`🚀 Server running on port: ${portToTry}`)
  })

  server.on('error', (err) => {
    const error = err as NodeJS.ErrnoException; // err puede tener 'code'

    if (error.code === 'EADDRINUSE') {
      console.warn(`⚠️ Port ${portToTry} is in use, trying port ${DEFAULT_PORT}`)
      if (portToTry !== DEFAULT_PORT) {
        startServer(DEFAULT_PORT)
      } else {
        console.error('No available ports found.')
      }
    } else {
      console.error(err)
    }
  })
}


startServer(PORT)