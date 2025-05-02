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
    try {
        const plans = await Plan.find()
        res.status(200).json({
            message: 'Lista de planes',
            ok: true,
            data: plans
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
    try {
        const planId = req.params.id

        const plan = await Plan.findById(planId)
        if (!plan) {
            res.status(404).json({ message: 'Plan no encontrado', ok: false })
            return
        }

        res.status(200).json({
            message: 'Detalles del plan',
            ok: true,
            data: plan,
        })
    } catch (err) {
        next(err)
    }
}

async function joinPlan(req: Request, res: Response, next: NextFunction) {
    //id del plan
    const { id } = req.params;
    const userId = req.user?.id;
    const userNickName = req.user?.nickName;

    if (!userId) {
        console.log('No hay id de usuario en el token')
        res.status(403).json({ message: 'Usuario no autenticado', ok: false });
        return;
    }

    try {
        const user = await User.findById(userId).select('dni')
        if (!user || !user.dni || user.dni.trim() === '') {
            console.log('El usuario no tiene DNI registrado')
            res.status(400).json({ message: 'Debes registrar tu DNI para unirte a un plan', ok: false })
            return
        }

        const plan = await Plan.findById(id);
        if (!plan) {
            console.log('No se ha encontrado el plan')
            res.status(404).json({ message: 'Plan no encontrado', ok: false });
            return;
        }

        if (plan.creatorUser.toString() === userId.toString()) {
            console.log('El usuario no puede unirse a su propio plan')
            res.status(400).json({ message: 'No puedes unirte a tu propio plan', ok: false });
            return;
        }

        if (plan.passengers.find((passenger) => passenger.id === userId)) {
            console.log('Ya hay una plaza reservada para esta persona en este coche')
            res.status(400).json({ message: 'Ya hay una plaza reservada para esta persona en este coche', ok: false });
            return;
        }

        if (plan.placesAvailable <= 0) {
            console.log('No hay lugares disponibles')
            res.status(400).json({ message: 'No hay lugares disponibles', ok: false });
            return;
        }

        plan.passengers.push({ id: userId, nickName: userNickName, dni: user.dni });
        plan.placesAvailable -= 1;
        await plan.save();

        res.status(200).json({
            message: `Te has unido al plan de ${plan.title}`,
            ok: true,
            data: plan,
        });
        return;
    } catch (err) {
        next(err);
    }
}


export default { createPlan, listPlans, listPlansByCategory, getPlanById, joinPlan }
