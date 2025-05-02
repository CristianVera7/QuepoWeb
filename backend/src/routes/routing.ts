import { type Express } from 'express'
import user from '../controllers/user'
import post from '../controllers/post'
import plan from '../controllers/plan'
import multer, { type Multer } from 'multer'
import authController from '../controllers/authController'

// Configuracion de multer para almacenar en memoria
const storage = multer.memoryStorage()
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },  //5MB
})

function routing(app: Express): void {

  //Plan routes
  app.post('/plan/create', authController.validateToken, plan.createPlan)
  app.get('/plan/list', plan.listPlans)
  app.get('/plan/list/:category', plan.listPlansByCategory)
  app.post('/plan/join/:id', authController.validateToken, plan.joinPlan)
  // app.put('/plan/:id', user.validateToken, plan.updatePlan)
  // app.delete('/plan/:id', user.validateToken, plan.deletePlan)

  //post routes
  app.get('/post/list', post.postsList)
  app.post('/post/publish', upload.single('image'), post.add)

  //User routes
  app.get('/isLoged', authController.validateSession)
  app.get('/user/get', authController.validateToken, user.getUser)
  app.get('/user/hasDni', authController.validateToken, user.hasDni)
  app.post('/user/find', user.findUserEmail)
  app.post('/user/login', user.login)
  app.post('/user/register', user.register)
  app.put('/user/update', authController.validateToken, user.updateUser)
}

export default routing
