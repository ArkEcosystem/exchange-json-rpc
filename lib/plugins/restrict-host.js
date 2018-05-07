'use strict'

const mm = require('micromatch')

/**
 * The register method used by hapi.js.
 * @param  {Hapi.Server} server
 * @param  {Object} options
 * @return {void}
 */
const register = async (server, options) => {
  const defaultRemoteAddresses = ['::1', '127.0.0.1', '::ffff:127.0.0.1']

  server.ext({
    type: 'onRequest',
    method: async (request, h) => {
      let remoteAddress = request.info.remoteAddress

      if (remoteAddress.startsWith('::ffff:')) {
        remoteAddress = remoteAddress.replace('::ffff:', '')
      }

      if (options.allowRemote) {
        return h.continue
      }

      if (request.path.includes('broadcast')) {
        return h.continue
      }

      if (options.allow) {
        const allowedPatterns = defaultRemoteAddresses.concat(options.allow.split(','))

        if (!mm.isMatch(remoteAddress, allowedPatterns)) {
          return h.response().code(403).takeover()
        }
      }

      return h.continue
    }
  })
}

/**
 * The struct used by hapi.js.
 * @type {Object}
 */
exports.plugin = {
  name: 'rpc-restrict-host',
  version: '1.0.0',
  register
}
