import mongoose from 'mongoose'                                          // Importa Mongoose para conectarse a MongoDB
import dotenv from 'dotenv'                                              // Importa dotenv para leer variables de entorno
dotenv.config()                                                          // Carga las variables definidas en el archivo .env
const URLDB = process.env.URLDB || 'mongodb://db:27017/quepoDB_prod'     // Toma la URL de conexión a la base de datos desde las variables de entorno
// Si no se encuentra la URL, lanza un error para evitar intentar conectarse
if (!URLDB) {
  throw new Error('URLDB no está definida en el archivo .env')
}
// Función asíncrona que realiza la conexión a la base de datos
export default async function connect() {
  try {
    // Intenta conectar a MongoDB con la URL especificada
    await mongoose.connect(URLDB)
    
    console.log('Conexion con DB realizada', URLDB)   // Si tiene éxito, imprime mensaje de confirmación

  } catch (err) {
    console.log(err)                           // En caso de error, lo muestra por consola
  }
}
