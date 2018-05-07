const axios = require('axios')
const arkjs = require('arkjs')
const isUrl = require('is-url')
const sample = require('lodash/sample')
const logger = require('./logger')
const networks = require('../config/networks')

class Network {
  async setNetwork (network) {
    this.network = networks[network]

    await this.__loadRemotePeers()

    arkjs.crypto.setNetworkVersion(this.network.version)

    return this.network
  }

  async setServer (server) {
    if (!server) {
      server = await this.__getRandomPeer()
    }

    this.server = server

    return this.server
  }

  async getFromNode (url) {
    const nethash = this.network ? this.network.nethash : null

    if (!this.server) {
      await this.setServer()
    }

    if (!url.startsWith('http')) {
      url = `http://${this.server}${url}`
    }

    try {
      logger.info(`Sending request on "${this.network.name}" to "${url}"`)

      return axios.get(url, { headers: { nethash, version: '2.0.0', port: 1 } })
    } catch (error) {
      logger.error(error.message)
    }
  }

  async findAvailablePeers () {
    let peers = []

    try {
      const response = await this.getFromNode('/peer/list')

      const availablePeers = response.data.peers
        .filter((peer) => (peer.status === 'OK'))
        .map((peer) => (`${peer.ip}:${peer.port}`))

      for (let i = availablePeers.length - 1; i >= 0; i--) {
        await this.getFromNode(`http://${availablePeers[i]}/api/blocks/getHeight`)

        peers.push(availablePeers[i])
      }

      if (peers.length > 0) {
        this.network.peers = peers
      }
    } catch (error) {
      logger.error(error.message)
    }
  }

  async postTransaction (transaction, peer) {
    const server = peer || this.server

    return axios.post(`http://${server}/peer/transactions`, {
      transactions: [transaction]
    }, {
      headers: {
        nethash: this.network.nethash,
        version: '1.0.0',
        port: 1
      }
    })
  }

  async broadcast (transaction) {
    const peers = this.network.peers.slice(0, 10)

    for (let i = peers.length - 1; i >= 0; i--) {
      logger.info(`Broadcasting to ${peers[i]}`)

      await this.postTransaction(transaction, peers[i])
    }
  }

  async connect (network) {
    if (this.server) {
      logger.info(`Server is already configured as "${this.server}"`)
    }

    if (this.network && this.network.name === network) {
      logger.info(`Network is already configured as "${this.network.name}"`)
    }

    const configured = this.server && this.network && (this.network.name && this.network.name === network)

    if (!configured) {
      this.setNetwork(network)
      this.setServer()

      await this.findAvailablePeers()

      try {
        const response = await this.getFromNode('/api/loader/autoconfigure')

        this.network.config = response.data.network
      } catch (error) {
        return this.connect(network)
      }
    }
  }

  async __getRandomPeer () {
    await this.__loadRemotePeers()

    return sample(this.network.peers)
  }

  async __loadRemotePeers () {
    if (isUrl(this.network.peers)) {
      const response = await axios.get(this.network.peers)

      this.network.peers = response.data.map(peer => `${peer.ip}:${peer.port}`)
    }
  }
}

module.exports = new Network()
