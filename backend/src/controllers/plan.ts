import { Request, Response, NextFunction } from 'express'
import Plan from '../models/Plan'
import User from '../models/User'

/**
 * Crear un nuevo plan de viaje
 * - Verifica autenticación del usuario y presencia de nickname
 * - Valida que todos los campos obligatorios estén presentes
 * - Confirma que el usuario tenga DNI registrado
 * - Crea el plan con toda la información proporcionada
 */
async function createPlan(req: Request, res: Response, next: NextFunction) {
    const { title, category, description, route, dateTime, placesAvailable, price, carInformation } = req.body
    const creatorUser = req.user?.id
    const creatorNickName = req.user?.nickName

    // Verificar autenticación y nickname
    if (!creatorUser || !creatorNickName) {
        console.log('No hay id de usuario en el token o no hay nickname')
        res.status(403).json({ message: 'Usuario no autenticado o falta nickname', ok: false })
        return
    }

    // Validar campos obligatorios
    if (!title || !category || !description || !route || !dateTime || !placesAvailable || !price || !carInformation) {
        console.log('Faltan campos obligatorios')
        res.status(400).json({
            message: 'All fields are required',
            ok: false,
        })
        return
    }

    try {
        // Verificar que el usuario tenga DNI registrado
        const user = await User.findById(creatorUser).select('dni')
        if (!user || !user.dni || user.dni.trim() === '') {
            console.log('El usuario no tiene DNI registrado')
            res.status(400).json({ message: 'Debes registrar tu DNI para unirte a un plan', ok: false })
            return
        }

        // Crear nuevo plan con todos los datos
        const newPlan = new Plan({
            title,
            category,
            description,
            route: {
                location: {
                    origin: route.location.origin,
                    destination: route.location.destination,
                },
                duration: route.duration,
                distance: route.distance,
            },
            dateTime,
            creatorUser,
            creatorNickName,
            dni: user.dni,
            placesAvailable,
            price,
            carInformation: {
                carIdentifier: carInformation.carIdentifier,
                brand: carInformation.brand,
                model: carInformation.model,
                color: carInformation.color,
            },
        })

        // Guardar plan en base de datos
        console.log('Creando plan', newPlan)
        await newPlan.save()
        res.status(201).json({
            message: `El plan "${newPlan.title}" se ha creado correctamente`,
            ok: true,
            data: newPlan
        })
    }
    catch (err) {
        next(err)
    }
}

/**
 * Listar todos los planes disponibles
 * - Obtiene todos los planes de la base de datos
 * - Añade información sobre si el usuario actual es creador o pasajero de cada plan
 */
async function listPlans(req: Request, res: Response, next: NextFunction) {
    const userId = req.user?.id;
    const userNickName = req.user?.nickName;
    console.log(userId, userNickName);
    try {
        // Obtener todos los planes
        const plans = await Plan.find()

        // Agregar información de roles para cada plan
        const plansWithRoles = plans.map(plan => {
            const isCreator = plan.creatorUser.toString() === userId;
            const isPassenger = plan.passengers.some(passenger => passenger.userId && passenger.userId.toString() === userId?.toString());

            return {
                ...plan.toObject(),
                isCreator,
                isPassenger
            };
        });

        res.status(200).json({
            message: 'Lista de planes',
            ok: true,
            data: plansWithRoles
        })
    } catch (err) {
        next(err)
    }
}

/**
 * Listar planes por categoría específica
 * - Filtra planes según la categoría proporcionada en los parámetros
 */
async function listPlansByCategory(req: Request, res: Response, next: NextFunction) {
    try {
        const { category } = req.params
        // Buscar planes por categoría
        const plans = await Plan.find({ category })
        res.status(200).json({
            message: `Lista de planes de la categoria ${category}`,
            ok: true,
            data: plans
        })
    } catch (err) {
        next(err)
    }
}

/**
 * Obtener un plan específico por ID
 * - Solo permite acceso al creador del plan
 * - Verifica autenticación y propiedad del plan
 */
async function getPlanById(req: Request, res: Response, next: NextFunction) {
    const { id } = req.params;
    const userId = req.user?.id;

    // Verificar autenticación
    if (!userId) {
        res.status(403).json({
            message: 'Usuario no autenticado',
            ok: false
        });
        return
    }

    try {
        // Buscar el plan por ID
        const plan = await Plan.findById(id);

        if (!plan) {
            res.status(404).json({
                message: 'Plan no encontrado.',
                ok: false
            });
            return
        }

        // Verificar que el usuario sea el creador
        const isCreator = plan.creatorUser.toString() === userId.toString();
        if (!isCreator) {
            res.status(404).json({
                message: 'Usted no es el creador de este plan.',
                ok: false
            });
            return
        }

        res.status(200).json({
            message: `Plan encontrado: ${plan.title}`,
            ok: true,
            plan: plan,
            isCreator
        });

    } catch (err) {
        next(err);
    }
}

/**
 * Actualizar un plan existente
 * - Busca el plan por ID
 * - Actualiza todos los campos con los nuevos valores
 * - Guarda los cambios en la base de datos
 */
async function updatePlan(req: Request, res: Response, next: NextFunction) {
    const { id } = req.params;
    const userId = req.user?.id;

    // Verificar autenticación
    if (!userId) {
        res.status(403).json({
            message: 'Usuario no autenticado',
            ok: false
        });
        return
    }

    try {
        // Buscar el plan existente
        const plan = await Plan.findById(id);

        if (!plan) {
            res.status(404).json({
                message: 'Plan no encontrado.',
                ok: false
            });
            return
        }

        // Extraer datos del cuerpo de la petición
        const {
            title,
            category,
            description,
            route,
            dateTime,
            placesAvailable,
            price,
            carInformation
        } = req.body;

        // Actualizar los campos del plan
        plan.title = title;
        plan.category = category;
        plan.description = description;
        plan.route = route;
        plan.dateTime = new Date(dateTime);
        plan.placesAvailable = Number(placesAvailable);
        plan.price = Number(price);
        plan.carInformation = carInformation;

        // Guardar los cambios
        await plan.save();

        // Responder con éxito
        res.status(200).json({
            message: 'Plan actualizado con éxito',
            plan,
            ok: true
        });
        return

    } catch (err) {
        console.error('Error al actualizar plan:', err);
        next(err);
    }
}

/**
 * Solicitar unirse a un plan
 * - Verifica que el usuario tenga DNI registrado
 * - Confirma que el plan existe y el usuario no sea el creador
 * - Verifica que no haya solicitado ya unirse o esté ya en el plan
 * - Añade al usuario a la lista de pasajeros pendientes
 */
async function joinPlan(req: Request, res: Response, next: NextFunction) {
    const { id } = req.params;
    const userId = req.user?.id;
    const userNickName = req.user?.nickName;
    const { message } = req.body

    // Verificar autenticación
    if (!userId) {
        res.status(403).json({ message: 'Usuario no autenticado', ok: false });
        return
    }

    try {
        // Verificar que el usuario tenga DNI
        const user = await User.findById(userId).select('dni');
        if (!user || !user.dni || user.dni.trim() === '') {
            res.status(400).json({ message: 'Debes registrar tu DNI para unirte a un plan', ok: false });
            return
        }

        // Buscar el plan
        const plan = await Plan.findById(id);
        if (!plan) {
            res.status(404).json({ message: 'Plan no encontrado', ok: false });
            return
        }

        // Verificar que no sea el creador del plan
        if (plan.creatorUser.toString() === userId.toString()) {
            res.status(400).json({ message: 'No puedes unirte a tu propio plan', ok: false });
            return
        }

        // Verificar que no esté ya pendiente o en el plan
        const alreadyPending = plan.pendingPassengers.some(p => p.userId && p.userId.toString() === userId.toString());
        const alreadyIn = plan.passengers.some(p => p.userId && p.userId.toString() === userId.toString());


        if (alreadyPending || alreadyIn) {
            res.status(400).json({ message: 'Ya solicitaste o participas en este plan', ok: false });
            return
        }

        // Añadir a pasajeros pendientes
        const userFind = await User.findById(userId);
        if (!userFind) throw new Error('Usuario no encontrado');

        plan.pendingPassengers.push({
            userId: userFind._id,
            nickName: userFind.nickName,
            message: message,
        });

        await plan.save();

        res.status(200).json({
            message: `Solicitud enviada al creador del plan: ${plan.title}`,
            ok: true,
        });
    } catch (err) {
        next(err);
    }
}

async function cancelJoinRequest(req: Request, res: Response, next: NextFunction) {
    try {
        console.log('cancelJoinRequest iniciada');

        const userId = req.user?.id;
        const userNickName = req.user?.nickName;
        const { planId } = req.params;

        console.log(`userId: ${userId}, userNickName: ${userNickName}, planId: ${planId}`);

        if (!userId || !userNickName) {
            console.warn('Usuario no autenticado o token incompleto');
            res.status(403).json({
                message: 'Usuario no autenticado o datos incompletos del token.',
                ok: false
            });
            return
        }

        const plan = await Plan.findById(planId);
        if (!plan) {
            console.warn('Plan no encontrado:', planId);
            res.status(404).json({
                message: 'Plan no encontrado.',
                ok: false
            });
            return
        }
        console.log('Plan encontrado:', planId);

        const isPending = plan.pendingPassengers.some(p => p.userId.toString() === userId.toString());

        if (!isPending) {
            console.warn('No existe solicitud pendiente para el usuario:', userId);
            res.status(400).json({
                message: 'No tienes una solicitud pendiente para este plan.',
                ok: false
            });
            return
        }

        plan.pendingPassengers = plan.pendingPassengers.filter(p => p.userId.toString() !== userId.toString());
        await plan.save();

        console.log('Solicitud pendiente eliminada y plan guardado');

        res.status(200).json({
            message: 'Tu solicitud pendiente ha sido cancelada exitosamente.',
            ok: true,
            updatedPlan: plan
        });
        return
    } catch (error) {
        console.error('Error en cancelJoinRequest:', error);
        res.status(500).json({
            message: 'Error interno del servidor',
            ok: false,
            error: error
        });
        return
    }
}


/**
 * Aprobar un pasajero pendiente
 * - Verifica que el usuario sea el creador del plan
 * - Mueve al pasajero de pendientes a pasajeros confirmados
 * - Reduce el número de plazas disponibles
 */
async function approvePassenger(req: Request, res: Response, next: NextFunction) {
    const { planId, passengerId } = req.params;
    const userId = req.user?.id;
    const userNickName = req.user?.nickName;

    // Verificar autenticación
    if (!userId) {
        res.status(403).json({ message: 'Usuario no autenticado', ok: false });
        return
    }

    try {
        // Buscar el plan
        const plan = await Plan.findById(planId);
        if (!plan) {
            res.status(404).json({ message: 'Plan no encontrado', ok: false });
            return
        }

        // Verificar que sea el creador
        if (plan.creatorUser.toString() !== userId.toString()) {
            res.status(403).json({ message: 'No autorizado para aprobar pasajeros', ok: false });
            return
        }
        console.log("PASAMOS POR AQUI");
        
        // Buscar al pasajero en pendientes
        const pendingPassenger = plan.pendingPassengers.find(p => p.userId.toString() === passengerId.toString());
        console.log(pendingPassenger);
        
        if (!pendingPassenger) {
            res.status(404).json({ message: 'Pasajero no encontrado en pendientes', ok: false });
            return
        }

        // Crear pasajero aprobado
        const confirmedPassenger = {
            userId: pendingPassenger.userId,
            nickName: pendingPassenger.nickName,
            isApproved: true
        }

        // Mover de pendientes a confirmados
        plan.passengers.push(confirmedPassenger);
        plan.pendingPassengers = plan.pendingPassengers.filter(p => p.userId.toString() !== passengerId.toString());
        plan.placesAvailable = Math.max(0, plan.placesAvailable - 1);
        await plan.save();

        res.status(200).json({ message: 'Pasajero aprobado', ok: true });
    } catch (error) {
        next(error);
    }
}

/**
 * Rechazar un pasajero pendiente
 * - Verifica que el usuario sea el creador del plan
 * - Elimina al pasajero de la lista de pendientes
 */
async function rejectPassenger(req: Request, res: Response, next: NextFunction) {
    const { planId, passengerId } = req.params;
    const userId = req.user?.id;
    const userNickName = req.user?.nickName;

    // Verificar autenticación
    if (!userId || !userNickName) {
        res.status(403).json({ message: 'Usuario no autenticado', ok: false });
        return
    }

    try {
        // Buscar el plan
        const plan = await Plan.findById(planId);
        if (!plan) {
            res.status(404).json({ message: 'Plan no encontrado', ok: false });
            return
        }

        // Verificar que sea el creador
        if (plan.creatorUser.toString() !== userId.toString()) {
            res.status(403).json({ message: 'No autorizado para rechazar pasajeros', ok: false });
            return
        }

        // Eliminar de pasajeros pendientes
        plan.pendingPassengers = plan.pendingPassengers.filter(p => p.userId.toString() !== passengerId.toString());
        await plan.save();

        res.status(200).json({ message: 'Pasajero rechazado/eliminado', ok: true });
    } catch (error) {
        next(error);
    }
}

/**
 * Obtener pasajeros pendientes de los planes creados por el usuario
 * - Busca todos los planes donde el usuario es creador
 * - Retorna información de los pasajeros pendientes de cada plan
 */
async function getPendingPassengers(req: Request, res: Response, next: NextFunction) {
    const userId = req.user?.id;
    const userNickName = req.user?.nickName;

    // Verificar autenticación
    if (!userId || !userNickName) {
        res.status(403).json({ message: 'Usuario no autenticado', ok: false });
        return;
    }

    try {
        // Buscar planes creados por el usuario
        const plans = await Plan.find({ creatorUser: userId });

        if (!plans || plans.length === 0) {
            res.status(200).json({
                message: 'No se encontraron planes creados por el usuario',
                ok: true,
                pendingPassengers: []
            });
            return;
        }

        // Mapear información de pasajeros pendientes
        const allPendingPassengers = plans.map(plan => ({
            planId: plan._id,
            planTitle: plan.title,

            pendingPassengers: plan.pendingPassengers.map((p:any) => ({

                userId: p.userId,
                nickName: p.nickName,
                message: p.message
            }))
        }));

        res.status(200).json({
            message: 'Pasajeros pendientes obtenidos',
            ok: true,
            plans: allPendingPassengers
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Obtener planes donde el usuario tiene solicitudes pendientes
 * - Busca planes donde el usuario está en la lista de pasajeros pendientes
 * - Retorna los IDs de esos planes
 */
async function getPendingRequests(req: Request, res: Response, next: NextFunction) {
    const userId = req.user?.id;

    // Verificar autenticación
    if (!userId) {
        res.status(403).json({ message: 'Usuario no autenticado', ok: false });
        return
    }

    try {
        // Buscar planes donde el usuario está como pendiente
        const plans = await Plan.find({ 'pendingPassengers.userId': userId });

        if (!plans.length) {
            res.status(200).json({
                message: 'No se encontraron planes a los que hayas solicitado unirte',
                ok: true,
                plans: []
            });
            return
        }

        // Mapear solo los IDs de los planes
        const userPendingPlans = plans.map(plan => ({ planId: plan._id }));

        res.status(200).json({
            message: 'Planes encontrados donde estás como pasajero pendiente',
            ok: true,
            plans: userPendingPlans
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Obtener planes del usuario (creados o donde participa)
 * - Busca planes donde el usuario es creador o pasajero confirmado
 * - Añade información de roles para cada plan
 */
async function myPlans(req: Request, res: Response, next: NextFunction) {
    try {
        const userId = req.user?.id;
        const userNickName = req.user?.nickName;

        // Verificar autenticación
        if (!userId || !userNickName) {
            res.status(403).json({
                message: 'Usuario no autenticado o datos incompletos del token.',
                ok: false
            });
            return
        }

        // Buscar planes donde es creador o pasajero
        const plans = await Plan.find({
            $or: [
                { creatorUser: userId },
                { 'passengers.userId': userId }
            ]
        });

        if (!plans.length) {
            res.status(404).json({
                message: 'No se encontraron planes creados ni en los que participes.',
                data: [],
                ok: false
            });
            return
        }

        // Agregar información de roles
        const plansWithRoles = plans.map(plan => {
            const isCreator = plan.creatorUser.toString() === userId;
            const isPassenger = plan.passengers.some(passenger =>passenger.userId && passenger.userId.toString() === userId.toString());


            return {
                ...plan.toObject(),
                isCreator,
                isPassenger
            };
        });

        res.status(200).json({
            message: 'Planes encontrados',
            plansList: plansWithRoles,
            ok: true
        });

    } catch (err) {
        next(err);
    }
}

/**
 * Salir de un plan como pasajero
 * - Verifica que el usuario esté inscrito como pasajero
 * - Elimina al usuario de la lista de pasajeros
 * - Incrementa el número de plazas disponibles
 */
async function leavePlan(req: Request, res: Response, next: NextFunction) {
    const userId = req.user?.id;
    const userNickName = req.user?.nickName;
    const { planId } = req.params
    try {

        // Verificar autenticación
        if (!userId || !userNickName) {
            res.status(403).json({
                message: 'Usuario no autenticado o datos incompletos del token.',
                ok: false
            });
            return
        }

        // Buscar el plan
        const plan = await Plan.findById(planId);
        if (!plan) {
            res.status(404).json({
                message: 'Plan no encontrado.',
                ok: false
            });
            return
        }

        console.log('userId: ', userId);
        console.log('plan.passengers: ', plan.passengers);

        // Verificar que esté inscrito como pasajero
        const wasPassenger = plan.passengers.some(p => p.userId.toString() === userId.toString());
        if (!wasPassenger) {
            res.status(400).json({
                message: 'No estás inscrito en este plan.',
                ok: false
            });
            return
        }

        // Eliminar de pasajeros e incrementar plazas
        plan.passengers = plan.passengers.filter(p => p.userId.toString() !== userId.toString());
        plan.placesAvailable += 1
        await plan.save();

        res.status(200).json({
            message: 'Has salido del plan exitosamente.',
            ok: true,
            updatedPlan: plan
        });
    } catch (error) {
        console.log(error);

    }
}

/**
 * Eliminar un plan completamente
 * - Verifica que el usuario sea el creador del plan
 * - Elimina el plan de la base de datos
 */
async function deletePlan(req: Request, res: Response, next: NextFunction) {
    const userId = req.user?.id;
    const userNickName = req.user?.nickName;
    const { planId } = req.params

    // Verificar autenticación
    if (!userId || !userNickName) {
        res.status(403).json({
            message: 'Usuario no autenticado o datos incompletos del token.',
            ok: false
        });
        return
    }

    try {
        // Buscar el plan
        const plan = await Plan.findById(planId);
        if (!plan) {
            res.status(404).json({
                message: 'Plan no encontrado.',
                ok: false
            });
            return
        }

        // Comprobar si el usuario es el creador de este plan
        if (plan.creatorUser.toString() !== userId.toString()) {
            res.status(403).json({
                message: 'No tienes permisos para eliminar este plan.',
                ok: false
            });
            return
        }

        // Eliminar el plan
        await plan.deleteOne();
        res.status(200).json({
            message: 'Plan eliminado exitosamente.',
            ok: true
        });

    } catch (error) {
        next(error)
    }
}

export default { createPlan, listPlans, getPlanById, updatePlan, listPlansByCategory, joinPlan, cancelJoinRequest, approvePassenger, rejectPassenger, getPendingPassengers, getPendingRequests, myPlans, leavePlan, deletePlan }