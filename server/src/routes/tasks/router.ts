import { Router } from 'express'
import {addTask, deleteTask, getTasks, updateTask} from "@app/routes/tasks/tasks.cotroller";


export function tasksRouter(): Router {
  const router = Router({ mergeParams: true })

  router.get('/', getTasks)
  router.get('/:id', getTasks)
  router.post('/', addTask)
  router.put('/:id', updateTask)
  router.delete('/:id', deleteTask)


  return router
}