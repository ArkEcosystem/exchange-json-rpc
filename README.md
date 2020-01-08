# @arkecosystem/exchange-json-rpc

<p align="center">
    <img src="https://raw.githubusercontent.com/ARKEcosystem/exchange-json-rpc/master/banner.png" />
</p>

[![Latest Version](https://badgen.now.sh/npm/v/@arkecosystem/exchange-json-rpc)](https://www.npmjs.com/package/@arkecosystem/exchange-json-rpc)
[![Node Engine](https://badgen.now.sh/npm/node/@arkecosystem/exchange-json-rpc)](https://www.npmjs.com/package/@arkecosystem/exchange-json-rpc)
[![Build Status](https://badgen.now.sh/circleci/github/ArkEcosystem/exchange-json-rpc)](https://circleci.com/gh/ArkEcosystem/exchange-json-rpc)
[![Codecov](https://badgen.now.sh/codecov/c/github/ArkEcosystem/exchange-json-rpc)](https://codecov.io/gh/ArkEcosystem/exchange-json-rpc)
[![License: MIT](https://badgen.now.sh/badge/license/MIT/green)](https://opensource.org/licenses/MIT)

> Lead Maintainer: [Brian Faust](https://github.com/faustbrian)

## Disclaimer

The Exchange JSON-RPC is only maintained for exchanges, as the name suggests. **We do not offer any support or guidance unless you are an Exchange in which case you most likely will already be in touch with us.**

## Installation

```bash
yarn global add @arkecosystem/exchange-json-rpc
```

## Usage

> All commands support a `-h` flag to show help for the specified command.

```sh
$ exchange-json-rpc
A JSON-RPC 2.0 specification compliant server for Exchanges to interact with the ARK Blockchain.

VERSION
  @arkecosystem/exchange-json-rpc/1.0.0 darwin-x64 node-v10.16.0

USAGE
  $ exchange-json-rpc [COMMAND]

COMMANDS
  autocomplete  display autocomplete installation instructions
  command
  commands      list all the commands
  help          display help for exchange-json-rpc
  log           Show the log
  restart       Restart the JSON-RPC
  run           Run the JSON-RPC (without pm2)
  start         Start the JSON-RPC
  status        Show the JSON-RPC status
  stop          Stop the JSON-RPC
  update        Update the exchange-json-rpc installation
```

### `start`

> Start the JSON-RPC

```sh
exchange-json-rpc start
```

| Flag               | Description                                                                  | Default                    | Required |
| ------------------ | ---------------------------------------------------------------------------- | -------------------------- | -------- |
| --[no-]allowRemote | allow remote connections which are filtered by a whitelist                   | n/a                        | No       |
| --network=         | the name of the network that should be used                                  | mainnet                    | No       |
| --token=           | the name of the token that should be used                                    | ark                        | No       |
| --host=            | the host that should be used to expose the RPC                               | 0.0.0.0                    | No       |
| --port=            | the port that should be used to expose the RPC                               | 8008                       | No       |
| --peer=            | the peer you want to use for communication, defaults to random network peers | n/a                        | No       |
| --maxLatency=      | the maximum allowed latency of a peer, defaults to 300ms                     | 300                        | No       |
| --whitelist=       | a comma separated list of IPs that can access the RPC                        | 127.0.0.1,::ffff:127.0.0.1 | No       |

### `restart`

> Restart the JSON-RPC

```sh
exchange-json-rpc restart
```

### `stop`

> Stop the JSON-RPC

```sh
exchange-json-rpc stop
```

| Flag   | Description                | Default | Required |
| ------ | -------------------------- | ------- | -------- |
| --kill | kill the process or daemon | n/a     | No       |

### `run`

> Run the JSON-RPC without pm2 **(exits on CTRL+C)**

```sh
exchange-json-rpc run
```

| Flag               | Description                                                                  | Default                    | Required |
| ------------------ | ---------------------------------------------------------------------------- | -------------------------- | -------- |
| --[no-]allowRemote | allow remote connections which are filtered by a whitelist                   | n/a                        | No       |
| --network=         | the name of the network that should be used                                  | mainnet                    | No       |
| --token=           | the name of the token that should be used                                    | ark                        | No       |
| --host=            | the host that should be used to expose the RPC                               | 0.0.0.0                    | No       |
| --port=            | the port that should be used to expose the RPC                               | 8008                       | No       |
| --peer=            | the peer you want to use for communication, defaults to random network peers | n/a                        | No       |
| --maxLatency=      | the maximum allowed latency of a peer, defaults to 300ms                     | 300                        | No       |
| --whitelist=       | a comma separated list of IPs that can access the RPC                        | 127.0.0.1,::ffff:127.0.0.1 | No       |

### `status`

> Show the JSON-RPC status

```sh
exchange-json-rpc status
```

### `update`

> Update the JSON-RPC installation

```sh
exchange-json-rpc update
```

### `log`

> Show the log

```sh
exchange-json-rpc log
```

| Flag     | Description             | Default | Required |
| -------- | ----------------------- | ------- | -------- |
| --error= | only show error output  | n/a     | No       |
| --lines= | number of lines to tail | 15      | No       |

## Security

If you discover a security vulnerability within this package, please send an e-mail to security@ark.io. All security vulnerabilities will be promptly addressed.

## Credits

This project exists thanks to all the people who [contribute](../../contributors).

## License

[MIT](LICENSE) © [ARK Ecosystem](https://ark.io)
