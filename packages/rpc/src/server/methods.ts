import { Crypto, Identities, Interfaces, Transactions } from "@arkecosystem/crypto";
import Boom from "@hapi/boom";
import { generateMnemonic } from "bip39";
import { IWallet } from "../interfaces";
import { database } from "../services/database";
import { network } from "../services/network";
import { decryptWIF, getBIP38Wallet } from "../utils/crypto";
import { buildDelegateRegistration, buildTransfer, buildUnvote, buildVote } from "../utils/transactions";

export const methods = [
    {
        name: "blocks.info",
        async method(params: { id: string }) {
            const response = await network.sendGET({ path: `blocks/${params.id}` });

            if (!response) {
                return Boom.notFound(`Block ${params.id} could not be found.`);
            }

            return response.data;
        },
        schema: {
            type: "object",
            properties: {
                id: { blockId: {} },
            },
            required: ["id"],
        },
    },
    {
        name: "blocks.latest",
        async method() {
            const response = await network.sendGET({
                path: "blocks",
                query: { orderBy: "height:desc", limit: 1 },
            });

            return response ? response.data[0] : Boom.notFound(`Latest block could not be found.`);
        },
    },
    {
        name: "blocks.transactions",
        async method(params: { id: string; offset?: number }) {
            const response = await network.sendGET({
                path: `blocks/${params.id}/transactions`,
                query: {
                    offset: params.offset,
                    orderBy: "timestamp:desc",
                },
            });

            if (!response) {
                return Boom.notFound(`Block ${params.id} could not be found.`);
            }

            return {
                count: response.meta.totalCount,
                data: response.data,
            };
        },
        schema: {
            type: "object",
            properties: {
                id: { blockId: {} },
                offset: {
                    type: "number",
                },
            },
            required: ["id"],
        },
    },
    {
        name: "transactions.broadcast",
        async method(params: { id: string }) {
            const transaction: Interfaces.ITransactionData = await database.get<Interfaces.ITransactionData>(params.id);

            if (!transaction) {
                return Boom.notFound(`Transaction ${params.id} could not be found.`);
            }

            const { data } = Transactions.TransactionFactory.fromData(transaction);

            if (!Transactions.Verifier.verifyHash(data)) {
                return Boom.badData();
            }

            const broadcast = await network.sendPOST({
                path: "transactions",
                body: {
                    transactions: [transaction],
                },
            });

            if (Object.keys(broadcast.errors || {}).length > 0) {
                return Boom.badData(broadcast.errors[transaction.id][0].message);
            }

            return transaction;
        },
        schema: {
            type: "object",
            properties: {
                id: {
                    $ref: "transactionId",
                },
            },
            required: ["id"],
        },
    },
    {
        name: "transactions.create",
        async method(params: {
            recipientId: string;
            amount: string;
            passphrase: string;
            vendorField?: string;
            fee?: string;
        }) {
            let transaction: Interfaces.ITransactionData;

            try {
                transaction = await buildTransfer(params, "sign");
            } catch (error) {
                return Boom.badData(error.message);
            }

            await database.set<Interfaces.ITransactionData>(transaction.id, transaction);

            return transaction;
        },
        schema: {
            type: "object",
            properties: {
                amount: {
                    type: "number",
                },
                recipientId: {
                    type: "string",
                    $ref: "address",
                },
                passphrase: {
                    type: "string",
                },
                vendorField: {
                    type: "string",
                },
                fee: {
                    type: "string",
                },
            },
            required: ["amount", "recipientId", "passphrase"],
        },
    },
    {
        name: "transactions.transfer.create",
        async method(params: {
            recipientId: string;
            amount: string;
            passphrase: string;
            vendorField?: string;
            fee?: string;
        }) {
            let transaction: Interfaces.ITransactionData;

            try {
                transaction = await buildTransfer(params, "sign");
            } catch (error) {
                return Boom.badData(error.message);
            }

            await database.set<Interfaces.ITransactionData>(transaction.id, transaction);

            return transaction;
        },
        schema: {
            type: "object",
            properties: {
                amount: {
                    type: "number",
                },
                recipientId: {
                    type: "string",
                    $ref: "address",
                },
                passphrase: {
                    type: "string",
                },
                vendorField: {
                    type: "string",
                },
                fee: {
                    type: "string",
                },
            },
            required: ["amount", "recipientId", "passphrase"],
        },
    },
    {
        name: "transactions.delegateRegistration.create",
        async method(params: { username: string; passphrase: string; fee?: string }) {
            let transaction: Interfaces.ITransactionData;

            try {
                transaction = await buildDelegateRegistration(params, "sign");
            } catch (error) {
                return Boom.badData(error.message);
            }

            await database.set<Interfaces.ITransactionData>(transaction.id, transaction);

            return transaction;
        },
        schema: {
            type: "object",
            properties: {
                username: {
                    type: "string",
                },
                passphrase: {
                    type: "string",
                },
                fee: {
                    type: "string",
                },
            },
            required: ["username", "passphrase"],
        },
    },
    {
        name: "transactions.vote.create",
        async method(params: { publicKey: string; passphrase: string; fee?: string }) {
            let transaction: Interfaces.ITransactionData;

            try {
                transaction = await buildVote(params, "sign");
            } catch (error) {
                return Boom.badData(error.message);
            }

            await database.set<Interfaces.ITransactionData>(transaction.id, transaction);

            return transaction;
        },
        schema: {
            type: "object",
            properties: {
                publicKey: {
                    type: "string",
                },
                passphrase: {
                    type: "string",
                },
                fee: {
                    type: "string",
                },
            },
            required: ["publicKey", "passphrase"],
        },
    },
    {
        name: "transactions.unvote.create",
        async method(params: { publicKey: string; passphrase: string; fee?: string }) {
            let transaction: Interfaces.ITransactionData;

            try {
                transaction = await buildUnvote(params, "sign");
            } catch (error) {
                return Boom.badData(error.message);
            }

            await database.set<Interfaces.ITransactionData>(transaction.id, transaction);

            return transaction;
        },
        schema: {
            type: "object",
            properties: {
                publicKey: {
                    type: "string",
                },
                passphrase: {
                    type: "string",
                },
                fee: {
                    type: "string",
                },
            },
            required: ["publicKey", "passphrase"],
        },
    },
    {
        name: "transactions.info",
        async method(params: { id: string }) {
            const response = await network.sendGET({ path: `transactions/${params.id}` });

            if (!response) {
                return Boom.notFound(`Transaction ${params.id} could not be found.`);
            }

            return response.data;
        },
        schema: {
            type: "object",
            properties: {
                id: {
                    $ref: "transactionId",
                },
            },
            required: ["id"],
        },
    },
    {
        name: "transactions.bip38.create",
        async method(params: {
            userId: string;
            bip38: string;
            recipientId: string;
            amount: string;
            vendorField?: string;
            fee?: string;
        }) {
            try {
                const wallet: IWallet = await getBIP38Wallet(params.userId, params.bip38);

                if (!wallet) {
                    return Boom.notFound(`User ${params.userId} could not be found.`);
                }

                let transaction: Interfaces.ITransactionData;

                try {
                    transaction = await buildTransfer({ ...params, ...{ passphrase: wallet.wif } }, "signWithWif");
                } catch (error) {
                    return Boom.badData();
                }

                await database.set<Interfaces.ITransactionData>(transaction.id, transaction);

                return transaction;
            } catch (error) {
                return Boom.badImplementation(error.message);
            }
        },
        schema: {
            type: "object",
            properties: {
                amount: {
                    type: "number",
                },
                recipientId: {
                    type: "string",
                    $ref: "address",
                },
                vendorField: {
                    type: "string",
                },
                fee: {
                    type: "string",
                },
                bip38: {
                    type: "string",
                },
                userId: {
                    type: "string",
                    $ref: "hex",
                },
            },
            required: ["amount", "recipientId", "bip38", "userId"],
        },
    },
    {
        name: "wallets.create",
        async method(params: { passphrase: string }) {
            const { publicKey }: Interfaces.IKeyPair = Identities.Keys.fromPassphrase(params.passphrase);

            return {
                publicKey,
                address: Identities.Address.fromPublicKey(publicKey),
            };
        },
        schema: {
            type: "object",
            properties: {
                passphrase: {
                    type: "string",
                },
            },
            required: ["passphrase"],
        },
    },
    {
        name: "wallets.info",
        async method(params: { address: string }) {
            const response = await network.sendGET({ path: `wallets/${params.address}` });

            if (!response) {
                return Boom.notFound(`Wallet ${params.address} could not be found.`);
            }

            return response.data;
        },
        schema: {
            type: "object",
            properties: {
                address: {
                    type: "string",
                    $ref: "address",
                },
            },
            required: ["address"],
        },
    },
    {
        name: "wallets.transactions",
        async method(params: { offset?: number; address: string }) {
            const response = await network.sendGET({
                path: `wallets/${params.address}/transactions`,
                query: {
                    offset: params.offset || 0,
                    orderBy: "timestamp:desc",
                },
            });

            if (!response || !response.data || !response.data.length) {
                return Boom.notFound(`Wallet ${params.address} could not be found.`);
            }

            return {
                count: response.meta.totalCount,
                data: response.data,
            };
        },
        schema: {
            type: "object",
            properties: {
                address: {
                    type: "string",
                    $ref: "address",
                },
                offset: {
                    type: "integer",
                },
            },
            required: ["address"],
        },
    },
    {
        name: "wallets.bip38.create",
        async method(params: { userId: string; bip38: string }) {
            try {
                const { keys, wif }: IWallet = await getBIP38Wallet(params.userId, params.bip38);

                return {
                    publicKey: keys.publicKey,
                    address: Identities.Address.fromPublicKey(keys.publicKey),
                    wif,
                };
            } catch (error) {
                const { publicKey, privateKey }: Interfaces.IKeyPair = Identities.Keys.fromPassphrase(
                    generateMnemonic(),
                );

                const encryptedWIF: string = Crypto.bip38.encrypt(
                    Buffer.from(privateKey, "hex"),
                    true,
                    params.bip38 + params.userId,
                );

                await database.set<string>(
                    Crypto.HashAlgorithms.sha256(Buffer.from(params.userId)).toString("hex"),
                    encryptedWIF,
                );

                return {
                    publicKey,
                    address: Identities.Address.fromPublicKey(publicKey),
                    wif: decryptWIF(encryptedWIF, params.userId, params.bip38).wif,
                };
            }
        },
        schema: {
            type: "object",
            properties: {
                bip38: {
                    type: "string",
                },
                userId: {
                    type: "string",
                    $ref: "hex",
                },
            },
            required: ["bip38", "userId"],
        },
    },
    {
        name: "wallets.bip38.info",
        async method(params: { userId: string; bip38: string }) {
            const encryptedWIF: string = await database.get<string>(
                Crypto.HashAlgorithms.sha256(Buffer.from(params.userId)).toString("hex"),
            );

            if (!encryptedWIF) {
                return Boom.notFound(`User ${params.userId} could not be found.`);
            }

            const { keys, wif }: IWallet = decryptWIF(encryptedWIF, params.userId, params.bip38);

            return {
                publicKey: keys.publicKey,
                address: Identities.Address.fromPublicKey(keys.publicKey),
                wif,
            };
        },
        schema: {
            type: "object",
            properties: {
                bip38: {
                    type: "string",
                },
                userId: {
                    type: "string",
                    $ref: "hex",
                },
            },
            required: ["bip38", "userId"],
        },
    },
];
