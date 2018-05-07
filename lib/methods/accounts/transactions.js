const Joi = require('joi')
const network = require('../../services/network')

module.exports = {
  name: 'accounts.transactions',
  method: async (params) => {
    const response = await network.getFromNode('/api/transactions', {
      offset: params.offset,
      orderBy: 'timestamp:desc',
      senderId: params.address,
      recipientId: params.address
    })

    return response.data
  },
  schema: {
    network: Joi.string().valid('mainnet', 'devnet').required(),
    address: Joi.string().length(34).required(),
    offset: Joi.number().default(0)
  }
}
