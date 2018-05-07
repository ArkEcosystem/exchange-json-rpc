const Joi = require('joi')
const arkjs = require('arkjs')

module.exports = {
  name: 'accounts.create',
  method: async (params) => {
    const account = arkjs.crypto.getKeys(params.passphrase)

    return {
      publicKey: account.publicKey,
      address: arkjs.crypto.getAddress(account.publicKey)
    }
  },
  schema: {
    network: Joi.string().valid('mainnet', 'devnet').required(),
    passphrase: Joi.string().required()
  }
}
