import {TaskModel} from "@models/task.model";
import {Request, Response} from 'express'
import * as console from "node:console";

export async function getTasks(req: Request<{ id?: string }>, res: Response) {
  const {id} = req.params;
  let tasks;


  if (id) {
    tasks = await TaskModel.query().where('id', id).first()
  } else {
    tasks = await TaskModel.query()
  }

  res.status(200).json({status: 'OK', data: tasks})
}

export async function addTask(req: Request, res: Response) {
  const {title, description, status} = req.body;

  const task = await TaskModel.query().insert({
    title,
    description,
    status,
  })

  res.status(200).json({status: 'OK', data: task})
}

export async function updateTask(req: Request, res: Response) {
  const {id} = req.params;
  const {title, description, status} = req.body;


  const isAltered = await TaskModel.query().findById(id).patch({
    title,
    description,
    status,
  })

  if(!isAltered) {
    res.status(404).json({status: 'Error', message: 'Task not found'})
    return
  }

  const task = await TaskModel.query().findById(id);

  res.status(200).json({status: 'OK', data: task})
}

export async function deleteTask(req: Request, res: Response) {
  const {id} = req.params;

  const task = await TaskModel.query().findById(id);

  if(!task) {
    res.status(404).json({status: 'Error', message: 'Task not found'})
    return
  }

  await TaskModel.query().deleteById(id);

  res.status(200).json({status: 'OK'})
}