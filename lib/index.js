'use strict'

const Hapi = require('hapi')
const logger = require('./services/logger')

function registerMethods (server, group) {
  Object.values(require(`./methods/${group}`)).forEach(method => {
    server.app.schemas[method.name] = method.schema

    delete method.schema

    server.method(method)
  })
}

/**
 * Create a new hapi.js server.
 * @param  {Object} options
 * @return {Hapi.Server}
 */
module.exports = async (options) => {
  if (options.allowRemote) {
    logger.warn('ARK-RPC allows remote connections, this is a potential security risk!')
  }

  const server = new Hapi.Server({ port: options.port })
  server.app.schemas = {}

  await server.register({ plugin: require('./plugins/restrict-host'), options })

  registerMethods(server, 'accounts')
  registerMethods(server, 'blocks')
  registerMethods(server, 'transactions')

  server.route(require('./handler'))

  try {
    await server.start()

    logger.info(`RPC Server is available and listening on ${server.info.uri}`)

    return server
  } catch (error) {
    logger.error(error.message)

    process.exit(1)
  }
}
