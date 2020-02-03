import { Identities, Interfaces, Transactions, Utils } from "@arkecosystem/crypto";
import { notStrictEqual } from "assert";
import { logger } from "../services/logger";
import { network } from "../services/network";

const buildTransaction = async (
    transactionBuilder,
    params: Record<string, any>,
    method: "sign" | "signWithWif",
): Promise<Interfaces.ITransactionData> => {
    if (params.fee) {
        transactionBuilder.fee(params.fee);
    } else {
        // Get the nonce of the sender wallet
        const senderAddress: string =
            method === "sign"
                ? Identities.Address.fromPassphrase(params.passphrase)
                : Identities.Address.fromPublicKey(Identities.PublicKey.fromWIF(params.passphrase));

        try {
            const { data } = await network.sendGET({
                path: `wallets/${senderAddress}`,
            });

            notStrictEqual(data.nonce, undefined);

            transactionBuilder.nonce(
                Utils.BigNumber.make(data.nonce)
                    .plus(1)
                    .toFixed(),
            );
        } catch (error) {
            throw new Error(`Failed to retrieve the nonce for ${senderAddress}.`);
        }

        // Get the average fee from the network
        try {
            const { data } = await network.sendGET({
                path: "node/fees",
            });

            const fee: string = data[1].transfer.avg;

            if (fee && Number(fee) > 0) {
                transactionBuilder.fee(fee);
            }
        } catch (error) {
            logger.warn("Failed to retrieve the average fee.");
        }
    }

    const transaction: Interfaces.ITransactionData = transactionBuilder[method](params.passphrase).getStruct();

    if (!Transactions.Verifier.verifyHash(transaction)) {
        throw new Error("Failed to verify the transaction.");
    }

    return transaction;
};

export const buildTransfer = async (
    params: {
        recipientId: string;
        amount: string;
        vendorField?: string;
        passphrase: string;
        fee?: string;
    },
    method: "sign" | "signWithWif",
): Promise<Interfaces.ITransactionData> => {
    const transactionBuilder = Transactions.BuilderFactory.transfer()
        .recipientId(params.recipientId)
        .amount(params.amount);

    if (params.vendorField) {
        transactionBuilder.vendorField(params.vendorField);
    }

    return buildTransaction(transactionBuilder, params, method);
};

export const buildDelegateRegistration = async (
    params: {
        username: string;
        passphrase: string;
        fee?: string;
    },
    method: "sign" | "signWithWif",
): Promise<Interfaces.ITransactionData> => {
    const transactionBuilder = Transactions.BuilderFactory.delegateRegistration()
        .usernameAsset(params.username);

    return buildTransaction(transactionBuilder, params, method);
};

export const buildVote = async (
    params: {
        publicKey: string;
        passphrase: string;
        fee?: string;
    },
    method: "sign" | "signWithWif",
): Promise<Interfaces.ITransactionData> => {
    const transactionBuilder = Transactions.BuilderFactory.vote().votesAsset([`+${params.publicKey}`]);

    return buildTransaction(transactionBuilder, params, method);
};

export const buildUnvote = async (
    params: {
        publicKey: string;
        passphrase: string;
        fee?: string;
    },
    method: "sign" | "signWithWif",
): Promise<Interfaces.ITransactionData> => {
    const transactionBuilder = Transactions.BuilderFactory.vote().votesAsset([`-${params.publicKey}`]);

    return buildTransaction(transactionBuilder, params, method);
};
