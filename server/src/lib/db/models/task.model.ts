import { Model } from 'objection'

export interface ITask {
  id?: string
  title: string
  description: string
  status: string
}

export class TaskModel extends Model implements ITask {
  static get tableName() {
    return 'tasks'
  }

  id?: string
  title!: string
  description!: string
  status!: string
}