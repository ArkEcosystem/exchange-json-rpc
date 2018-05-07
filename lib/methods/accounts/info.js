const Joi = require('joi')
const network = require('../../services/network')

module.exports = {
  name: 'accounts.info',
  method: async (params) => {
    const response = await network.getFromNode(`/api/accounts?address=${params.address}`)

    return response.data.account
  },
  schema: {
    network: Joi.string().valid('mainnet', 'devnet').required(),
    address: Joi.string().length(34).required()
  }
}
