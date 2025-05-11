import { Request, Response, NextFunction } from 'express'
import User from '../models/User'
import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'
import argon2 from 'argon2'

dotenv.config()

const tokenSecret = process.env.TOKEN_SECRET || "defaultSecret"
const expires = parseInt(process.env.TOKEN_EXPIRES || '10000')

declare module 'express' {
  export interface Request {
    user?: { id: string, nickName: string; email: string }
  }
}

async function register(req: Request, res: Response, next: NextFunction) {
  const { nickName, email, password } = req.body

  try {
    const hasUser = await User.findOne({ email: email })
    if (hasUser) {
      res.status(400).json({ message: `${email} ya tiene un usuario registrado`, ok: false })
      return
    }

    const hash = await argon2.hash(password)
    const newUser = new User({
      nickName,
      email,
      password: hash,
    })
    await newUser.save()
    res.status(201).json({
      message: 'POST example is working fine',
      data: `User´s nickname is the following: ${newUser.nickName}`,
      ok: true,
    })
  } catch (err) {
    next(err)
  }
}


function generateToken(user: { id: string, email: string; nickName: string }) {
  return jwt.sign(user, tokenSecret, { expiresIn: expires });
}

async function login(req: Request, res: Response, next: NextFunction) {
  const { email, password } = req.body
  try {
    const userExist = await User.findOne({ email }).select('nickName email password')
    if (!userExist) {
      res.status(400).json({ message: 'Usuario no encontrado' })
      return
    }

    const passwordMatch = await argon2.verify(userExist.password, password)
    if (!passwordMatch) {
      res.status(400).json({ message: 'Usuario y password no coinciden' })
      return
    }

    const user = { id: userExist.id, nickName: userExist.nickName, email: userExist.email }
    const accesToken = generateToken(user)
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

async function findUserEmail(req: Request, res: Response, next: NextFunction) {
  const { email } = req.body
  try {
    const hasEmail = await User.findOne({ email: email })
    if (!hasEmail) {
      res.status(404).json({ message: `${email} no está registrado` });
      return
    }
    res.status(200).json({
      message: `${email} is registered👍`,
      ok: true,
    })
  } catch (err) {
    next(err)
  }
}

async function getUser(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id

    if (!userId) {
      res.status(401).json({ message: 'No autorizado: ID de usuario no presente en el token' })
      return
    }

    const user = await User.findById(userId).select('nickName email dni')
    if (!user) {
      res.status(404).json({ message: 'Usuario no encontrado' })
      return
    }

    res.status(200).json({
      ok: true,
      message: 'Usuario encontrado',
      data: user,
    })
  } catch (err) {
    next(err)
  }
}

async function updateUser(req: Request, res: Response, next: NextFunction) {
  const { password, newPassword, dni } = req.body;
  console.log('updateUser', req.body);
  const userId = req.user?.id;

  try {
    if (!userId) {
      res.status(401).json({ message: 'No autorizado: ID de usuario no presente en el token' });
      return;
    }

    const user = await User.findById(userId).select('password');
    if (!user) {
      res.status(404).json({ message: 'Usuario no encontrado' });
      return
    }

    if (dni) {
      const existingUserWithDni = await User.findOne({ dni });
      if (existingUserWithDni && existingUserWithDni._id.toString() !== userId) {
        res.status(400).json({ message: 'El DNI ya está en uso por otro usuario' });
        return;
      }
      user.dni = dni;
    }

    if (password && newPassword) {

      if (password === newPassword) {
        res.status(400).json({ message: 'La nueva contraseña no puede ser igual a la actual' });
        return;
      }

      if (!user.password || typeof user.password !== 'string' || user.password.trim() === '') {
        console.log('aquiiiii');
        res.status(500).json({ message: 'El hash de la contraseña del usuario es inválido' });
        return;
      }

      const passwordMatch = await argon2.verify(user.password, password);
      console.log('passwordMatch', passwordMatch);
      if (!passwordMatch) {
        res.status(400).json({ message: 'La contraseña actual es incorrecta' });
        return
      }

      user.password = await argon2.hash(newPassword);
    }

    await user.save();

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

async function hasDni(req: Request, res: Response, next: NextFunction) {
  const userId = req.user?.id
  try {
    if (!userId) {
      res.status(401).json({ message: 'No autorizado: ID de usuario no presente en el token' })
      return
    }

    const user = await User.findById(userId).select('dni')
    if (!user) {
      res.status(404).json({ message: 'Usuario no encontrado' })
      return
    }

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

async function deleteUser(req: Request, res: Response, next: NextFunction) {
  const userId = req.user?.id;
  const { password } = req.body;
  try {
    if (!userId) {
      res.status(401).json({ message: 'No autorizado: ID de usuario no presente' });
      return;
    }

    if (!password || typeof password !== 'string') {
      res.status(400).json({ message: 'La contraseña es obligatoria para eliminar la cuenta' });
      return;
    }

    const user = await User.findById(userId).select(' password');
    if (!user) {
      res.status(404).json({ message: 'Usuario no encontrado' });
      return;
    }

    const passwordMatch = await argon2.verify(user.password, password);
    if (!passwordMatch) {

      res.status(401).json({ message: 'Contraseña incorrecta' });
      return;
    }

    await User.findByIdAndDelete(userId);

    res.status(200).json({
      message: 'Cuenta eliminada correctamente',
      ok: true,
    });
  } catch (err) {
    next(err);
  }
}


export default { register, login, findUserEmail, getUser, updateUser, hasDni, deleteUser }
