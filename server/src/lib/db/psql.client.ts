import KnexImport, { Knex } from 'knex'
import { Model } from 'objection'
import { buildDatabaseConfig } from '@lib/db/buildDatabaseConfig.js'

const knex = KnexImport.default

let knexDb: Knex
export function postgresDatabase(): Knex {
  if (!knexDb) {

    if (!process.env.ENVIRONMENT || process.env.ENVIRONMENT === 'development') {
      knexDb = knex({
        client: 'pg',
        connection: process.env.POSTGRES_CONNECTION_STRING,

        pool: {
          min: parseInt(process.env.DB_MIN_CONNECTIONS!, 10) || 2,
          max: parseInt(process.env.DB_MAX_CONNECTIONS!, 10) || 10,
        },
      })

    } else {
      knexDb = knex(buildDatabaseConfig(process.env.POSTGRES_CONNECTION_STRING!, {
        pool: {
          min: parseInt(process.env.DB_MIN_CONNECTIONS!, 10) || 2,
          max: parseInt(process.env.DB_MAX_CONNECTIONS!, 10) || 10,
        },
      }))
    }


    Model.knex(knexDb)
  }

  return knexDb
}

export async function destroyDBConnection() {
  await new Promise<void>((resolve) => {
    postgresDatabase().destroy(() => {
      resolve()
    })
  })
}