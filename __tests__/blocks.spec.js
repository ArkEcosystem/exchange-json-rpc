const request = require('./__support__/request')
const arkjs = require('arkjs')

jest.setTimeout(60000)

describe('Blocks', () => {
  describe('GET /mainnet/blocks/latest', () => {
    it('should get the latest block', async () => {
      const response = await request('blocks.latest', {
        network: 'mainnet'
      })

      await expect(response.data.result.id).toBeNumber()
    })
  })

  describe('GET /mainnet/blocks/{id}', () => {
    it('should get the block information', async () => {
      const response = await request('blocks.info', {
        network: 'mainnet',
        id: '18017180930038348026'
      })

      await expect(response.data.result.id).toBe('18017180930038348026')
    })
  })

  describe('GET /mainnet/blocks/{id}/transactions', () => {
    it('should get the block transactions', async () => {
      const response = await request('blocks.transactions', {
        network: 'mainnet',
        id: '18017180930038348026'
      })

      await expect(response.data.result.transactions).toHaveLength(50)
    })
  })
})
