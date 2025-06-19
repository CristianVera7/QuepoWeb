import { type Express } from 'express'                       // Importa el tipo 'Express' para tipar correctamente la función de enrutado
import user from '../controllers/user'                       // Importa el controlador de usuarios
import plan from '../controllers/plan'                       // Importa el controlador de planes
import authController from '../controllers/authController'   // Importa el controlador de autenticación
import map from '../controllers/map'                         // Importa el controlador de mapas

function routing(app: Express): void {

  // ---------------- PLAN ROUTES ----------------

  // Obtiene todos los planes (requiere token válido)
  app.get('/plan/list', authController.validateToken, plan.listPlans)

  // Obtiene planes filtrados por categoría (no requiere autenticación)
  app.get('/plan/list/:category', plan.listPlansByCategory)

  // Obtiene planes con pasajeros pendientes de aprobación (requiere token)
  app.get('/plan/pending', authController.validateToken, plan.getPendingPassengers)

  // Obtiene los planes creados por el usuario autenticado
  app.get('/plan/myPlans', authController.validateToken, plan.myPlans)

  // Obtiene un plan específico por ID (requiere autenticación)
  app.get('/plan/getPlanById/:id', authController.validateToken, plan.getPlanById)

  // Obtiene las solicitudes pendientes para un plan (requiere autenticación)
  app.get('/plan/pendingRequest', authController.validateToken, plan.getPendingRequests)

  // Crea un nuevo plan (requiere token válido)
  app.post('/plan/create', authController.validateToken, plan.createPlan)

  // Solicita unirse a un plan específico (requiere autenticación)
  app.post('/plan/join/:id', authController.validateToken, plan.joinPlan)

  // Aprueba a un pasajero en un plan (requiere autenticación)
  app.post('/plan/:planId/passengers/:passengerId/approve', authController.validateToken, plan.approvePassenger)

  // Rechaza a un pasajero en un plan (requiere autenticación)
  app.post('/plan/:planId/passengers/:passengerId/reject', authController.validateToken, plan.rejectPassenger)

  // Actualiza un plan existente (requiere autenticación)
  app.put('/plan/update/:id', authController.validateToken, plan.updatePlan)

  // Permite a un pasajero salir de un plan (requiere autenticación)
  app.delete('/plan/passengerDelete/:planId', authController.validateToken, plan.leavePlan)

  // Elimina un plan completo (requiere autenticación)
  app.delete('/plan/delete/:planId', authController.validateToken, plan.deletePlan)

  // Cancela una solicitud de unirse a un plan (requiere autenticación)
  app.delete('/plans/:planId/cancel-request', authController.validateToken, plan.cancelJoinRequest);


  // ---------------- USER ROUTES ----------------

  // Verifica si la sesión del usuario es válida mediante el token
  app.get('/isLoged', authController.validateToken, authController.validateSession)

  // Obtiene los datos del usuario autenticado
  app.get('/user/get', authController.validateToken, user.getUser)

  // Verifica si el usuario ha completado su DNI (requiere autenticación)
  app.get('/user/hasDni', authController.validateToken, user.hasDni)

  // Busca usuario por email (sin autenticación, útil para recuperación o login)
  app.post('/user/find', user.findUserEmail)

  // Autentica un usuario y genera token
  app.post('/user/login', user.login)

  // Registra un nuevo usuario
  app.post('/user/register', user.register)

  // Actualiza datos del usuario autenticado
  app.put('/user/update', authController.validateToken, user.updateUser)

  // Elimina la cuenta del usuario autenticado
  app.delete('/user/delete', authController.validateToken, user.deleteUser)

  // ---------------- MAP ROUTES ----------------
  // Obtiene coordenadas geográficas a partir de una dirección
  // app.get('/map/geocode', map.geocode)

  // app.get('/map/reverse-geocode', map.reverseGeocode);
}

export default routing    // Exporta la función para ser utilizada en la inicialización del servidor
