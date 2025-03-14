import { Knex } from 'knex'
import { ConnectionString } from 'connection-string'

export function buildDatabaseConfig(
  connectionString: string,
  options?: Partial<Knex.Config>
): Knex.Config {
  if (!connectionString) {
    throw new Error('Connection string is not provided')
  }
  const connection = new ConnectionString(connectionString);

  console.log("CONNECTION", connection)


  if (!connection.path || !connection.path.length) {
    throw new Error('DB Connection host is not specified')
  }

  const connectionOptions = {
    client: 'pg',
    ...options,
    connection: {
      user: connection.user,
      password: decodeURIComponent(connection?.password || ''),
      host: connection.hostname,
      port: connection.port,
      database: connection.path[0],
      multipleStatements: Boolean(connection.params?.multipleStatements),
    },
  };



  return connectionOptions
}
