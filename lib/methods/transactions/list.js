const Joi = require('joi')
const database = require('../../services/database')

module.exports = {
  name: 'transactions.list',
  method: async (params) => {
    const transactions = await database.get('transactions')

    return transactions
  },
  schema: {
    network: Joi.string().valid('mainnet', 'devnet').required()
  }
}
