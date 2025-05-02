import { Request, Response, NextFunction } from 'express'

async function getMainTemplate(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  // GET METHOD Example
  try {
    res.status(200).json({
      message: 'GET main example root is working fine',
      ok: true,
    })
  } catch (err) {
    console.log(err)
  }
}
async function getTemplate(req: Request, res: Response, next: NextFunction) {
  // GET METHOD Example
  try {
    res.status(200).json({
      message: 'GET example is working fine',
      ok: true,
    })
  } catch (err) {
    console.log(err)
  }
}
async function postTemplate(req: Request, res: Response, next: NextFunction) {
  // GET METHOD Example
  try {
    console.log(req.body)
    const { nickName } = req.body

    res.status(200).json({
      message: 'POST example is working fine',
      data: `User´s nickname is the following: ${nickName}`,
      ok: true,
    })
  } catch (err) {
    console.log(err)
  }
}

export default {
  getMainTemplate,
  getTemplate,
  postTemplate,
}
