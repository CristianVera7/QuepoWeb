import { type Express } from 'express'
import user from '../controllers/user'
import plan from '../controllers/plan'
import authController from '../controllers/authController'

function routing(app: Express): void {

  //Plan routes
  app.get('/plan/list', authController.validateToken, plan.listPlans)
  app.get('/plan/list/:category', plan.listPlansByCategory)
  app.get('/plan/pending', authController.validateToken, plan.getPendingPassengers);
  app.get('/plan/myPlans', authController.validateToken, plan.myPlans)
  app.get('/plan/getPlanById/:id', authController.validateToken, plan.getPlanById)
  app.get('/plan/pendingRequest', authController.validateToken, plan.getPendingRequests)
  app.post('/plan/create', authController.validateToken, plan.createPlan)
  app.post('/plan/join/:id', authController.validateToken, plan.joinPlan)
  app.post('/plan/:planId/passengers/:passengerId/approve', authController.validateToken, plan.approvePassenger);
  app.post('/plan/:planId/passengers/:passengerId/reject', authController.validateToken, plan.rejectPassenger);
  app.put('/plan/update/:id', authController.validateToken, plan.updatePlan)
  app.delete('/plan/passengerDelete/:planId', authController.validateToken, plan.leavePlan)
  app.delete('/plan/delete/:planId', authController.validateToken, plan.deletePlan)

  //User routes
  app.get('/isLoged', authController.validateToken, authController.validateSession)
  app.get('/user/get', authController.validateToken, user.getUser)
  app.get('/user/hasDni', authController.validateToken, user.hasDni)
  app.post('/user/find', user.findUserEmail)
  app.post('/user/login', user.login)
  app.post('/user/register', user.register)
  app.put('/user/update', authController.validateToken, user.updateUser)
  app.delete('/user/delete', authController.validateToken, user.deleteUser)
}

export default routing
