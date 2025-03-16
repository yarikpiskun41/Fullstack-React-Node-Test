import { Model } from 'objection'

export interface IUser {
  id?: number
  username: string,
  password: string,
  created_at?: Date,
  updated_at?: Date,
}
export class UserModel extends Model implements IUser {
  static get tableName() {
    return 'users'
  }
  id?: number;
  username!: string;
  password!: string;
  created_at?: Date;
  updated_at?: Date;
}

