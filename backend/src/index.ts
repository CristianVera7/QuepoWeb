import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import routing from './routes/routing'
import connect from './dbConnect/dbConnect'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3000

// Configuración de orígenes permitidos
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .filter(Boolean)
  .map(origin => origin.trim()) // Elimina espacios en blanco

console.log('Orígenes permitidos:', allowedOrigins)

// Configuración CORS mejorada
app.use(
  cors({
    origin: (origin, callback) => {
      console.log('Petición desde origen:', origin)
      
      // Permitir peticiones sin origen (como Postman, aplicaciones móviles, etc.)
      if (!origin) {
        console.log('Petición sin origen - permitida')
        return callback(null, true)
      }
      
      // Verificar si el origen está en la lista permitida
      if (allowedOrigins.includes(origin)) {
        console.log('Origen permitido:', origin)
        callback(null, true)
      } else {
        console.log('Origen NO permitido:', origin)
        console.log('Lista de orígenes permitidos:', allowedOrigins)
        callback(new Error(`CORS: Origen ${origin} no permitido`))
      }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: [
      'Content-Type', 
      'Authorization', 
      'Accept',
      'Origin',
      'X-Requested-With'
    ],
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 200
  })
)

// Middleware adicional para manejar preflight requests manualmente si es necesario
app.options('*', (req, res) => {
  console.log('Preflight request recibida para:', req.path)
  res.header('Access-Control-Allow-Origin', req.headers.origin)
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS,PATCH')
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, Origin, X-Requested-With')
  res.header('Access-Control-Allow-Credentials', 'true')
  res.sendStatus(200)
})

app.use(express.json())

connect()
routing(app)

const server = app.listen(PORT, () => {
  console.log(`Server running on port: ${PORT}`)
  console.log('CORS configurado para los orígenes:', allowedOrigins)
})