import { Crypto, Identities, Interfaces, Managers, Transactions, Utils } from "@arkecosystem/crypto";
import { notStrictEqual } from "assert";
import wif from "wif";
import { IWallet } from "../interfaces";
import { database } from "../services/database";
import { logger } from "../services/logger";
import { network } from "../services/network";

export const getBIP38Wallet = async (userId, bip38password): Promise<IWallet> => {
    const encryptedWif: string = await database.get(Crypto.HashAlgorithms.sha256(Buffer.from(userId)).toString("hex"));

    return encryptedWif ? decryptWIF(encryptedWif, userId, bip38password) : undefined;
};

export const decryptWIF = (encryptedWif, userId, bip38password): IWallet => {
    const decrypted: Interfaces.IDecryptResult = Crypto.bip38.decrypt(
        encryptedWif.toString("hex"),
        bip38password + userId,
    );

    const encodedWIF: string = wif.encode(
        Managers.configManager.get("network.wif"),
        decrypted.privateKey,
        decrypted.compressed,
    );

    return { keys: Identities.Keys.fromWIF(encodedWIF), wif: encodedWIF };
};

export const buildTransaction = async (
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

            const fee: string = data.find(({ type }) => type === 0).avg;

            if (fee && Number(fee) > 0) {
                transactionBuilder.fee(fee);
            }
        } catch (error) {
            logger.warn("Failed to retrieve the average fee.");
        }
    }

    const transaction: Interfaces.ITransactionData = transactionBuilder[method](params.passphrase).getStruct();

    if (!Transactions.Verifier.verifyHash(transaction)) {
        throw new Error("...");
    }

    return transaction;
};
