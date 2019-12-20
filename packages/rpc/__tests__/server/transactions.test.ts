import "jest-extended";

import { Transactions } from "@arkecosystem/crypto";
import { Server } from "@hapi/hapi";
import { randomBytes } from "crypto";
import nock from "nock";
import { launchServer, sendRequest } from "../__support__";

let server: Server;
beforeAll(async () => (server = await launchServer()));
afterAll(async () => server.stop());

afterEach(async () => jest.restoreAllMocks());

const verifyTransaction = (data): boolean => Transactions.TransactionFactory.fromData(data).verify();

describe("Transactions", () => {
    nock(/\d+\.\d+\.\d+\.\d+/)
        .persist()
        .get("/api/v2/peers")
        .reply(200, {
            data: [
                {
                    ip: "167.114.29.53",
                    port: 4001,
                    ports: {
                        "@arkecosystem/core-api": 4003,
                    },
                },
            ],
        })
        .get("/api/blockchain")
        .reply(200, {
            data: {
                block: {
                    height: 10702529,
                    id: "aa6f13f08e32db84991ec8a7b19558b99027eac2d02920d19ded2222a55fba0a",
                },
                supply: "14625386000000004",
            },
        });

    describe("POST transactions.info", () => {
        it("should get the transaction for the given ID", async () => {
            nock(/\d+\.\d+\.\d+\.\d+/)
                .get("/api/transactions/3e3817fd0c35bc36674f3874c2953fa3e35877cbcdb44a08bdc6083dbd39d572")
                .reply(200, {
                    data: {
                        id: "3e3817fd0c35bc36674f3874c2953fa3e35877cbcdb44a08bdc6083dbd39d572",
                    },
                });
            const response = await sendRequest("transactions.info", {
                id: "3e3817fd0c35bc36674f3874c2953fa3e35877cbcdb44a08bdc6083dbd39d572",
            });

            expect(response.body.result.id).toBe("3e3817fd0c35bc36674f3874c2953fa3e35877cbcdb44a08bdc6083dbd39d572");
        });

        it("should fail to get the transaction for the given ID", async () => {
            nock(/\d+\.\d+\.\d+\.\d+/)
                .get("/api/transactions/e4311204acf8a86ba833e494f5292475c6e9e0913fc455a12601b4b6b55818d8")
                .reply(404, {
                    statusCode: 404,
                    error: "Not Found",
                    message:
                        "Transaction e4311204acf8a86ba833e494f5292475c6e9e0913fc455a12601b4b6b55818d8 could not be found.",
                });
            const response = await sendRequest("transactions.info", {
                id: "e4311204acf8a86ba833e494f5292475c6e9e0913fc455a12601b4b6b55818d8",
            });

            expect(response.body.error.code).toBe(404);
            expect(response.body.error.message).toBe(
                "Transaction e4311204acf8a86ba833e494f5292475c6e9e0913fc455a12601b4b6b55818d8 could not be found.",
            );
        });
    });

    describe("POST transactions.create", () => {
        it("should create a new transaction and verify", async () => {
            const response = await sendRequest("transactions.create", {
                amount: 100000000,
                recipientId: "D61mfSggzbvQgTUe6JhYKH2doHaqJ3Dyib",
                passphrase: "this is a top secret passphrase",
            });

            expect(response.body.result.recipientId).toBe("D61mfSggzbvQgTUe6JhYKH2doHaqJ3Dyib");
            expect(verifyTransaction(response.body.result)).toBeTrue();
        });

        xit("should create a new transaction with a vendor field and verify", async () => {
            const response = await sendRequest("transactions.create", {
                amount: 100000000,
                passphrase: "this is a top secret passphrase",
                recipientId: "D61mfSggzbvQgTUe6JhYKH2doHaqJ3Dyib",
                vendorField: "Hello World",
            });

            expect(response.body.result.recipientId).toBe("D61mfSggzbvQgTUe6JhYKH2doHaqJ3Dyib");
            expect(response.body.result.vendorField).toBe("Hello World");
            expect(verifyTransaction(response.body.result)).toBeTrue();
        });

        xit("should return 422 if it fails to verify the transaction", async () => {
            const spyVerify = jest.spyOn(Transactions.Verifier, "verifyHash").mockImplementation(() => false);

            const response = await sendRequest("transactions.create", {
                amount: 100000000,
                recipientId: "D61mfSggzbvQgTUe6JhYKH2doHaqJ3Dyib",
                passphrase: "this is a top secret passphrase",
            });

            expect(response.body.error.code).toBe(422);
            expect(spyVerify).toHaveBeenCalled();
        });
    });

    describe("POST transactions.broadcast", () => {
        xit("should broadcast the transaction", async () => {
            const transaction = await sendRequest("transactions.create", {
                amount: 100000000,
                recipientId: "D61mfSggzbvQgTUe6JhYKH2doHaqJ3Dyib",
                passphrase: "this is a top secret passphrase",
            });

            const response = await sendRequest("transactions.broadcast", {
                id: transaction.body.result.id,
            });

            expect(verifyTransaction(response.body.result)).toBeTrue();
        });

        xit("should fail to broadcast the transaction", async () => {
            const response = await sendRequest("transactions.broadcast", {
                id: "e4311204acf8a86ba833e494f5292475c6e9e0913fc455a12601b4b6b55818d8",
            });

            expect(response.body.error.code).toBe(404);
            expect(response.body.error.message).toBe(
                "Transaction e4311204acf8a86ba833e494f5292475c6e9e0913fc455a12601b4b6b55818d8 could not be found.",
            );
        });

        xit("should return 422 if it fails to verify the transaction", async () => {
            const transaction = await sendRequest("transactions.create", {
                amount: 100000000,
                recipientId: "D61mfSggzbvQgTUe6JhYKH2doHaqJ3Dyib",
                passphrase: "this is a top secret passphrase",
            });

            const spyVerify: jest.SpyInstance = jest
                .spyOn(Transactions.Verifier, "verifyHash")
                .mockImplementation(() => false);

            const response = await sendRequest("transactions.broadcast", {
                id: transaction.body.result.id,
            });

            expect(response.body.error.code).toBe(422);
            expect(spyVerify).toHaveBeenCalled();
        });
    });

    describe("POST transactions.bip38.create", () => {
        const userId: string = randomBytes(32).toString("hex");

        xit("should create a new transaction", async () => {
            await sendRequest("wallets.bip38.create", {
                bip38: "this is a top secret passphrase",
                userId,
            });

            const response = await sendRequest("transactions.bip38.create", {
                bip38: "this is a top secret passphrase",
                userId,
                amount: 1000000000,
                recipientId: "D61mfSggzbvQgTUe6JhYKH2doHaqJ3Dyib",
            });

            expect(response.body.result.recipientId).toBe("D61mfSggzbvQgTUe6JhYKH2doHaqJ3Dyib");
            expect(verifyTransaction(response.body.result)).toBeTrue();
        });

        xit("should create a new transaction with a vendor field", async () => {
            const response = await sendRequest("transactions.bip38.create", {
                bip38: "this is a top secret passphrase",
                userId,
                amount: 1000000000,
                recipientId: "D61mfSggzbvQgTUe6JhYKH2doHaqJ3Dyib",
                vendorField: "Hello World",
            });

            expect(response.body.result.recipientId).toBe("D61mfSggzbvQgTUe6JhYKH2doHaqJ3Dyib");
            expect(response.body.result.vendorField).toBe("Hello World");
            expect(verifyTransaction(response.body.result)).toBeTrue();
        });

        xit("should fail to create a new transaction", async () => {
            const response = await sendRequest("transactions.bip38.create", {
                bip38: "this is a top secret passphrase",
                userId: "123456789",
                amount: 1000000000,
                recipientId: "D61mfSggzbvQgTUe6JhYKH2doHaqJ3Dyib",
            });

            expect(response.body.error.code).toBe(404);
            expect(response.body.error.message).toBe("User 123456789 could not be found.");
        });

        xit("should return 422 if it fails to verify the transaction", async () => {
            const spyVerify: jest.SpyInstance = jest
                .spyOn(Transactions.Verifier, "verifyHash")
                .mockImplementation(() => false);

            const response = await sendRequest("transactions.bip38.create", {
                bip38: "this is a top secret passphrase",
                userId,
                amount: 1000000000,
                recipientId: "D61mfSggzbvQgTUe6JhYKH2doHaqJ3Dyib",
                vendorField: "Hello World",
            });

            expect(response.body.error.code).toBe(422);
            expect(spyVerify).toHaveBeenCalled();
        });
    });
});
