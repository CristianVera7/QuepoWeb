import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'
dotenv.config()

const tokenSecret = process.env.TOKEN_SECRET || "defaultSecret"
const expires = parseInt(process.env.TOKEN_EXPIRES || '10000')

function validateToken(req: Request, res: Response, next: NextFunction) {
    const tokenHeader = req.headers.authorization || ''
    const accesToken = tokenHeader.split('Bearer ')[1]

    if (!accesToken) {
        res.status(401).json({ message: 'Acceso denegado, no se encontró el token' })
        return
    }

    jwt.verify(accesToken, tokenSecret, (err, user) => {
        if (err) {
            res.json('Acceso denegado, el token ha caducado o es incorrecto')
            return
        }

        const payload = user as { id: string, nickName: string; email: string }
        if (!payload.nickName) {
            console.log(payload);
            res.status(401).json({ message: 'Token inválido, falta el nickName del usuario' })
            return
        }
        
        req.user = payload
        next()
    })
}

function validateSession(req: Request, res: Response) {
    res.status(200).json({
        ok: true,
        message: 'Sesión válida',
        user: req.user,
    });
}


export default { validateToken, validateSession }