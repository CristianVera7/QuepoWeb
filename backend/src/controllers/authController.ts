import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'
dotenv.config()

// Configuración de variables de entorno para JWT
const tokenSecret = process.env.TOKEN_SECRET || "defaultSecret"
const expires = parseInt(process.env.TOKEN_EXPIRES || '10000')

/**
 * Middleware para validar tokens JWT
 * FLUJO:
 * 1. Extrae el token del header Authorization (formato: "Bearer <token>")
 * 2. Verifica si el token existe
 * 3. Valida el token usando la clave secreta
 * 4. Decodifica el payload y verifica que contenga nickName
 * 5. Añade la información del usuario al objeto request
 * 6. Continúa con el siguiente middleware/controlador
 */
function validateToken(req: Request, res: Response, next: NextFunction) {
    // Extraer header de autorización
    const tokenHeader = req.headers.authorization || ''
    // Separar "Bearer " del token real
    const accesToken = tokenHeader.split('Bearer ')[1]

    // Verificar si el token existe
    if (!accesToken) {
        res.status(401).json({ message: 'Acceso denegado, no se encontró el token' })
        return
    }

    // Verificar y decodificar el token JWT
    jwt.verify(accesToken, tokenSecret, (err, user) => {
        // Si hay error en la verificación (token expirado, inválido, etc.)
        if (err) {
            res.json('Acceso denegado, el token ha caducado o es incorrecto')
            return
        }

        // Castear el payload a la estructura esperada
        const payload = user as { id: string, nickName: string; email: string }
        
        // Verificar que el payload contenga el nickName (campo crítico)
        if (!payload.nickName) {
            console.log(payload);
            res.status(401).json({ message: 'Token inválido, falta el nickName del usuario' })
            return
        }
        
        // Añadir información del usuario al objeto request para uso posterior
        req.user = payload
        // Continuar con el siguiente middleware/controlador
        next()
    })
}

/**
 * Endpoint para validar si la sesión actual es válida
 * FLUJO:
 * 1. Asume que ya pasó por validateToken middleware
 * 2. Retorna información de sesión válida con datos del usuario
 * 
 * Utilizado para:
 * - Verificar autenticación desde el frontend
 * - Obtener datos del usuario autenticado
 * - Confirmar que el token sigue siendo válido
 */
function validateSession(req: Request, res: Response) {
    res.status(200).json({
        ok: true,
        message: 'Sesión válida',
        user: req.user, // Información del usuario decodificada del token
    });
}

export default { validateToken, validateSession }