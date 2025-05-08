import { Request, Response, NextFunction } from 'express'
import Plan from '../models/Plan'
import User from '../models/User'

async function createPlan(req: Request, res: Response, next: NextFunction) {
    const { title, category, description, route, dateTime, placesAvailable, price, carInformation } = req.body
    const creatorUser = req.user?.id
    const creatorNickName = req.user?.nickName

    if (!creatorUser || !creatorNickName) {
        console.log('No hay id de usuario en el token o no hay nickname')
        res.status(403).json({ message: 'Usuario no autenticado o falta nickname', ok: false })
        return
    }

    if (!title || !category || !description || !route || !dateTime || !placesAvailable || !price || !carInformation) {
        console.log('Faltan campos obligatorios')
        res.status(400).json({
            message: 'All fields are required',
            ok: false,
        })
        return
    }

    try {
        const user = await User.findById(creatorUser).select('dni')
        if (!user || !user.dni || user.dni.trim() === '') {
            console.log('El usuario no tiene DNI registrado')
            res.status(400).json({ message: 'Debes registrar tu DNI para unirte a un plan', ok: false })
            return
        }

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

async function listPlans(req: Request, res: Response, next: NextFunction) {
    const userId = req.user?.id;
    const userNickName = req.user?.nickName;
    try {
        const plans = await Plan.find()

        const plansWithRoles = plans.map(plan => {
            const isCreator = plan.creatorUser.toString() === userId;
            const isPassenger = plan.passengers.some(passenger => passenger.id.toString() === userId);

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

async function listPlansByCategory(req: Request, res: Response, next: NextFunction) {
    try {
        const { category } = req.params
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

async function getPlanById(req: Request, res: Response, next: NextFunction) {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
        res.status(403).json({
            message: 'Usuario no autenticado',
            ok: false
        });
        return
    }

    try {
        const plan = await Plan.findById(id);

        if (!plan) {
            res.status(404).json({
                message: 'Plan no encontrado.',
                ok: false
            });
            return
        }

        const isCreator = plan.creatorUser.toString() === userId.toString();
        if (!isCreator) {
            res.status(404).json({
                message: 'Usted no es el creador de este plan.',
                ok: false
            });
            return
        }

        res.status(200).json({
            message: `Encontrado el plan: ${plan.title}`,
            ok: true,
            plan: plan,
            isCreator
        });

    } catch (err) {
        next(err);
    }
}

async function updatePlan(req: Request, res: Response, next: NextFunction) {
    const { id } = req.params;
    const userId = req.user?.id;

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




async function joinPlan(req: Request, res: Response, next: NextFunction) {
    const { id } = req.params;
    const userId = req.user?.id;
    const userNickName = req.user?.nickName;
    const { message } = req.body

    if (!userId) {
        res.status(403).json({ message: 'Usuario no autenticado', ok: false });
        return
    }

    try {
        const user = await User.findById(userId).select('dni');
        if (!user || !user.dni || user.dni.trim() === '') {
            res.status(400).json({ message: 'Debes registrar tu DNI para unirte a un plan', ok: false });
            return
        }

        const plan = await Plan.findById(id);
        if (!plan) {
            res.status(404).json({ message: 'Plan no encontrado', ok: false });
            return
        }

        if (plan.creatorUser.toString() === userId.toString()) {
            res.status(400).json({ message: 'No puedes unirte a tu propio plan', ok: false });
            return
        }

        const alreadyPending = plan.pendingPassengers.some(p => p.id === userId);
        const alreadyIn = plan.passengers.some(p => p.id === userId);

        if (alreadyPending || alreadyIn) {
            res.status(400).json({ message: 'Ya solicitaste o participas en este plan', ok: false });
            return
        }

        plan.pendingPassengers.push({
            id: userId,
            nickName: userNickName,
            dni: user.dni,
            message: message
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


async function approvePassenger(req: Request, res: Response, next: NextFunction) {
    const { planId, passengerId } = req.params;
    const userId = req.user?.id;
    const userNickName = req.user?.nickName;

    if (!userId) {
        res.status(403).json({ message: 'Usuario no autenticado', ok: false });
        return
    }

    try {
        const plan = await Plan.findById(planId);
        if (!plan) {
            res.status(404).json({ message: 'Plan no encontrado', ok: false });
            return
        }

        if (plan.creatorUser.toString() !== userId.toString()) {
            res.status(403).json({ message: 'No autorizado para aprobar pasajeros', ok: false });
            return
        }

        const passenger = plan.pendingPassengers.find(p => p.id === passengerId);
        if (!passenger) {
            res.status(404).json({ message: 'Pasajero no encontrado en pendientes', ok: false });
            return
        }

        plan.passengers.push(passenger);
        plan.pendingPassengers.pull({ id: passengerId });
        plan.placesAvailable = Math.max(0, plan.placesAvailable - 1);
        await plan.save();

        res.status(200).json({ message: 'Pasajero aprobado', ok: true });
    } catch (error) {
        next(error);
    }
}

async function rejectPassenger(req: Request, res: Response, next: NextFunction) {
    const { planId, passengerId } = req.params;
    const userId = req.user?.id;
    const userNickName = req.user?.nickName;

    if (!userId || !userNickName) {
        res.status(403).json({ message: 'Usuario no autenticado', ok: false });
        return
    }

    try {
        const plan = await Plan.findById(planId);
        if (!plan) {
            res.status(404).json({ message: 'Plan no encontrado', ok: false });
            return
        }

        if (plan.creatorUser.toString() !== userId.toString()) {
            res.status(403).json({ message: 'No autorizado para rechazar pasajeros', ok: false });
            return
        }

        plan.pendingPassengers.pull({ id: passengerId });
        await plan.save();

        res.status(200).json({ message: 'Pasajero rechazado/eliminado', ok: true });
    } catch (error) {
        next(error);
    }
}

async function getPendingPassengers(req: Request, res: Response, next: NextFunction) {
    const userId = req.user?.id;
    const userNickName = req.user?.nickName;

    if (!userId || !userNickName) {
        res.status(403).json({ message: 'Usuario no autenticado', ok: false });
        return;
    }

    try {
        const plans = await Plan.find({ creatorUser: userId });

        if (!plans || plans.length === 0) {
            res.status(200).json({
                message: 'No se encontraron planes creados por el usuario',
                ok: true,
                pendingPassengers: []
            });
            return;
        }
        const allPendingPassengers = plans.map(plan => ({
            planId: plan._id,
            planTitle: plan.title,
            pendingPassengers: plan.pendingPassengers
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

async function myPlans(req: Request, res: Response, next: NextFunction) {
    try {
        const userId = req.user?.id;
        const userNickName = req.user?.nickName;

        if (!userId || !userNickName) {
            res.status(403).json({
                message: 'Usuario no autenticado o datos incompletos del token.',
                ok: false
            });
            return
        }

        const plans = await Plan.find({
            $or: [
                { creatorUser: userId },
                { 'passengers.id': userId }
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

        const plansWithRoles = plans.map(plan => {
            const isCreator = plan.creatorUser.toString() === userId;
            const isPassenger = plan.passengers.some(passenger => passenger.id.toString() === userId);

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

async function leavePlan(req: Request, res: Response, next: NextFunction) {
    const userId = req.user?.id;
    const userNickName = req.user?.nickName;
    const { planId } = req.params
    try {

        if (!userId || !userNickName) {
            res.status(403).json({
                message: 'Usuario no autenticado o datos incompletos del token.',
                ok: false
            });
            return
        }

        const plan = await Plan.findById(planId);
        if (!plan) {
            res.status(404).json({
                message: 'Plan no encontrado.',
                ok: false
            });
            return
        }


        const wasPassenger = plan.passengers.some(p => p.id === userId);
        if (!wasPassenger) {
            res.status(400).json({
                message: 'No estás inscrito en este plan.',
                ok: false
            });
            return
        }

        plan.passengers.pull({ id: userId });
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



export default { createPlan, listPlans, getPlanById, updatePlan, listPlansByCategory, joinPlan, approvePassenger, rejectPassenger, getPendingPassengers, myPlans, leavePlan }
