import { Request, Response, NextFunction } from 'express'
import User from '../models/User'
import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'
import argon2 from 'argon2'

// Configuración de variables de entorno
dotenv.config()

// Variables de configuración para JWT
const tokenSecret = process.env.TOKEN_SECRET || "defaultSecret"
const expires = parseInt(process.env.TOKEN_EXPIRES || '10000')

// Extensión del tipo Request de express para incluir información del usuario autenticado
declare module 'express' {
  export interface Request {
    user?: { id: string, nickName: string; email: string }
  }
}

/**
 * Controlador para el registro de nuevos usuarios
 * Valida que el email no esté registrado, hashea la contraseña y crea el usuario
 */
async function register(req: Request, res: Response, next: NextFunction) {
  const { nickName, email, password } = req.body

  try {
    // Verificar si ya existe un usuario con el email proporcionado
    const hasUser = await User.findOne({ email: email })
    if (hasUser) {
      res.status(400).json({ message: `${email} ya tiene un usuario registrado`, ok: false })
      return
    }

    // Hashear la contraseña usando argon2 para seguridad
    const hash = await argon2.hash(password)

    // Crear nuevo usuario con los datos proporcionados
    const newUser = new User({
      nickName,
      email,
      password: hash,
    })

    // Guardar el usuario en la base de datos
    await newUser.save()

    // Respuesta exitosa con información del usuario creado
    res.status(201).json({
      message: 'POST example is working fine',
      data: `User´s nickname is the following: ${newUser.nickName}`,
      ok: true,
    })
  } catch (err) {
    // Pasar el error al middleware de manejo de errores
    next(err)
  }
}

/**
 * Función auxiliar para generar tokens JWT
 * @param user - Objeto con información del usuario (id, email, nickName)
 * @returns Token JWT firmado con expiración configurada
 */
function generateToken(user: { id: string, email: string; nickName: string }) {
  return jwt.sign(user, tokenSecret, { expiresIn: expires });
}

/**
 * Controlador para el login de usuarios
 * Valida credenciales y genera token de acceso si son correctas
 */
async function login(req: Request, res: Response, next: NextFunction) {
  const { email, password } = req.body

  try {
    // Buscar usuario por email incluyendo la contraseña hasheada
    const userExist = await User.findOne({ email }).select('nickName email password')
    if (!userExist) {
      res.status(400).json({ message: 'Usuario no encontrado' })
      return
    }

    // Verificar si la contraseña proporcionada coincide con el hash almacenado
    const passwordMatch = await argon2.verify(userExist.password, password)
    if (!passwordMatch) {
      res.status(400).json({ message: 'Usuario y password no coinciden' })
      return
    }

    // Crear objeto usuario para el token (sin contraseña)
    const user = { id: userExist.id, nickName: userExist.nickName, email: userExist.email }

    // Generar token de acceso
    const accesToken = generateToken(user)

    // Enviar token en header Authorization y en el cuerpo de la respuesta
    res.header('Authorization', `Bearer ${accesToken}`).json({
      message: 'Usuario autenticado',
      token: accesToken,
      ok: true,
      expires: expires,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Controlador para verificar si un email está registrado
 * Útil para validaciones del frontend
 */
async function findUserEmail(req: Request, res: Response, next: NextFunction) {
  const { email } = req.body

  try {
    // Buscar si existe un usuario con el email proporcionado
    const hasEmail = await User.findOne({ email: email })
    if (!hasEmail) {
      res.status(404).json({ message: `${email} no está registrado` });
      return
    }

    // Confirmar que el email está registrado
    res.status(200).json({
      message: `${email} is registered👍`,
      ok: true,
    })
  } catch (err) {
    next(err)
  }
}

/**
 * Controlador para obtener información del usuario autenticado
 * Requiere token válido en la request
 */
async function getUser(req: Request, res: Response, next: NextFunction) {
  try {
    // Obtener ID del usuario desde el token decodificado
    const userId = req.user?.id

    if (!userId) {
      res.status(401).json({ message: 'No autorizado: ID de usuario no presente en el token' })
      return
    }

    // Buscar usuario por ID, excluyendo información sensible
    const user = await User.findById(userId).select('nickName email dni')
    if (!user) {
      res.status(404).json({ message: 'Usuario no encontrado' })
      return
    }

    // Devolver información del usuario
    res.status(200).json({
      ok: true,
      message: 'Usuario encontrado',
      data: user,
    })
  } catch (err) {
    next(err)
  }
}

/**
 * Controlador para actualizar información del usuario
 * Permite cambiar DNI y/o contraseña con validaciones apropiadas
 */
async function updateUser(req: Request, res: Response, next: NextFunction) {
  const { password, newPassword, dni } = req.body;
  console.log('updateUser', req.body);
  const userId = req.user?.id;

  try {
    if (!userId) {
      res.status(401).json({ message: 'No autorizado: ID de usuario no presente en el token' });
      return;
    }

    // Buscar usuario incluyendo la contraseña para verificaciones
    const user = await User.findById(userId).select('password');
    if (!user) {
      res.status(404).json({ message: 'Usuario no encontrado' });
      return
    }

    // Actualizar DNI si se proporciona
    if (dni) {
      // Verificar que el DNI no esté siendo usado por otro usuario
      const existingUserWithDni = await User.findOne({ dni });
      if (existingUserWithDni && existingUserWithDni._id.toString() !== userId) {
        res.status(400).json({ message: 'El DNI ya está en uso por otro usuario' });
        return;
      }
      user.dni = dni;
    }

    // Cambiar contraseña si se proporcionan ambas (actual y nueva)
    if (password && newPassword) {
      // Validar que la nueva contraseña sea diferente a la actual
      if (password === newPassword) {
        res.status(400).json({ message: 'La nueva contraseña no puede ser igual a la actual' });
        return;
      }

      // Validar integridad del hash de contraseña almacenado
      if (!user.password || typeof user.password !== 'string' || user.password.trim() === '') {
        console.log('aquiiiii');
        res.status(500).json({ message: 'El hash de la contraseña del usuario es inválido' });
        return;
      }

      // Verificar que la contraseña actual sea correcta
      const passwordMatch = await argon2.verify(user.password, password);
      console.log('passwordMatch', passwordMatch);
      if (!passwordMatch) {
        res.status(400).json({ message: 'La contraseña actual es incorrecta' });
        return
      }

      // Hashear la nueva contraseña
      user.password = await argon2.hash(newPassword);
    }

    // Guardar los cambios en la base de datos
    await user.save();

    // Respuesta exitosa con datos actualizados (sin contraseña)
    res.status(200).json({
      message: 'Usuario actualizado',
      data: {
        nickName: user.nickName,
        email: user.email,
        dni: user.dni,
      },
      ok: true,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Controlador para verificar si el usuario tiene DNI registrado
 * Útil para validaciones condicionales en el frontend
 */
async function hasDni(req: Request, res: Response, next: NextFunction) {
  const userId = req.user?.id

  try {
    if (!userId) {
      res.status(401).json({ message: 'No autorizado: ID de usuario no presente en el token' })
      return
    }

    // Obtener solo el campo DNI del usuario
    const user = await User.findById(userId).select('dni')
    if (!user) {
      res.status(404).json({ message: 'Usuario no encontrado' })
      return
    }

    // Verificar si el usuario tiene DNI válido (no vacío)
    const hasDni = !!user.dni && user.dni.trim() !== ''

    res.status(200).json({
      message: hasDni ? 'El usuario tiene DNI' : 'El usuario no tiene DNI',
      ok: true,
      hasDni,
    })
  } catch (err) {
    next(err)
  }
}

/**
 * Controlador para eliminar cuenta de usuario
 * Requiere confirmación con contraseña para seguridad
 */
async function deleteUser(req: Request, res: Response, next: NextFunction) {
  const userId = req.user?.id;
  const { password } = req.body;

  try {
    if (!userId) {
      res.status(401).json({ message: 'No autorizado: ID de usuario no presente' });
      return;
    }

    // Validar que se proporcione la contraseña para confirmar eliminación
    if (!password || typeof password !== 'string') {
      res.status(400).json({ message: 'La contraseña es obligatoria para eliminar la cuenta' });
      return;
    }

    // Buscar usuario incluyendo la contraseña para verificación
    const user = await User.findById(userId).select(' password');
    if (!user) {
      res.status(404).json({ message: 'Usuario no encontrado' });
      return;
    }

    // Verificar que la contraseña proporcionada sea correcta
    const passwordMatch = await argon2.verify(user.password, password);
    if (!passwordMatch) {
      res.status(401).json({ message: 'Contraseña incorrecta' });
      return;
    }

    // Eliminar usuario de la base de datos
    await User.findByIdAndDelete(userId);

    // Confirmación de eliminación exitosa
    res.status(200).json({
      message: 'Cuenta eliminada correctamente',
      ok: true,
    });
  } catch (err) {
    next(err);
  }
}

// Exportar todos los controladores para su uso en las rutas
export default { register, login, findUserEmail, getUser, updateUser, hasDni, deleteUser }