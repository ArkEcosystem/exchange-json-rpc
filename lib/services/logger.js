'use strict'

const pino = require('pino')

const pretty = pino.pretty()
pretty.pipe(process.stdout)

module.exports = pino({
  name: 'ark-json-rpc-server',
  safe: true
}, pretty)
