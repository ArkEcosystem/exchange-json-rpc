# ARK JSON-RPC

<p align="center">
    <img src="https://cdn-images-1.medium.com/max/2000/1*QFNTgOOP_9NIaNwIrBnp_w.png" />
</p>

> A [JSON-RPC 2.0 Specification](http://www.jsonrpc.org/specification) compliant server to interact with the ARK blockchain.

### Security Warning for Production

All calls should be made from the server where JSON-RPC is running at ( i.e., `localhost` or `127.0.0.1` ). The JSON-RPC server should never be publicly accessible. If you wish to access ark-rpc from a remote address, you can whitelist the address with `--allow <address>`. Addresses allow you to use wildcards, eg. `192.168.1.*` or `10.0.*.*`.

If you do want to allow access from all remotes, start ark-rpc with the `--allow-remote` commandline switch. This can be dangerous.

## Installation

Before you can get started with ARK RPC you will need to install [node.js](https://nodejs.org/). If you are not on Ubuntu, headover to the [installation instructions](https://nodejs.org/en/download/package-manager/) to find more details for your operating system.

```bash
$ curl -sL https://deb.nodesource.com/setup_10.x | sudo -E bash -
$ sudo apt-get install -y nodejs
```

After you have installed node.js and made sure it is working you are ready to setup pm2 and ARK JSON-RPC.

```bash
$ npm install pm2 -g
$ npm install arkecosystem/ark-rpc#master
```

## Running the JSON-RPC Server

### pm2

The recommended way of running and keeping your JSON-RPC server alive is [pm2](http://pm2.keymetrics.io/).

```bash
$ pm2 start ark-rpc
```

### Docker

If you would like to run from a docker environment, you will first need to build the container by running:

```bash
$ docker build -t ark-rpc .
```

You will need to run the container with the `--allow-remote` option to allow the host machine to access the container.

```bash
$ docker run -d -p 8080:8080 ark-rpc --allow-remote
```

## Security

If you discover a security vulnerability within this package, please send an e-mail to security@ark.io. All security vulnerabilities will be promptly addressed.

## Credits

- [François-Xavier Thoorens](https://github.com/fix)
- [Brian Faust](https://github.com/faustbrian)
- [All Contributors](./contributors)

## License

[MIT](LICENSE) © [ArkEcosystem](https://ark.io)
