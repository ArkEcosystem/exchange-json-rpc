import "jest-extended";

import { Transactions } from "@arkecosystem/crypto";
import { Server } from "@hapi/hapi";
import { randomBytes } from "crypto";
import nock from "nock";
import { createServer, sendRequest } from "../__support__";

let server: Server;

beforeAll(async () => {
    nock("https://raw.githubusercontent.com")
        .persist()
        .get("/ArkEcosystem/peers/master/devnet.json")
        .reply(200, [
            {
                ip: "167.114.29.51",
                port: 4002,
            },
            {
                ip: "167.114.29.52",
                port: 4002,
            },
            {
                ip: "167.114.29.53",
                port: 4002,
            },
            {
                ip: "167.114.29.54",
                port: 4002,
            },
            {
                ip: "167.114.29.55",
                port: 4002,
            },
        ]);

    nock.disableNetConnect();

    server = await createServer();
});

afterAll(() => nock.enableNetConnect());

afterEach(() => jest.restoreAllMocks());

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
        })
        .get("/api/node/fees")
        .reply(200, {
            meta: {
                days: 7,
            },
            data: {
                "1": {
                    transfer: {
                        avg: "4714424",
                        max: "10000000",
                        min: "333000",
                        sum: "188576954",
                    },
                    vote: {
                        avg: "68453150",
                        max: "100000000",
                        min: "1000000",
                        sum: "2122047658",
                    },
                    ipfs: {
                        avg: "500000000",
                        max: "500000000",
                        min: "500000000",
                        sum: "500000000",
                    },
                    multiPayment: {
                        avg: "9986191",
                        max: "10000000",
                        min: "6480000",
                        sum: "11064700000",
                    },
                    htlcLock: {
                        avg: "10000000",
                        max: "10000000",
                        min: "10000000",
                        sum: "30000000",
                    },
                },
            },
        })
        .get(/\api\/wallets\/.*/)
        .reply(200, {
            data: {
                nonce: "1",
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
            const response = await sendRequest(server, "transactions.info", {
                id: "3e3817fd0c35bc36674f3874c2953fa3e35877cbcdb44a08bdc6083dbd39d572",
            });

            expect(response.body.result.id).toBe("3e3817fd0c35bc36674f3874c2953fa3e35877cbcdb44a08bdc6083dbd39d572");
        });

        it("should fail to get the transaction for the given ID", async () => {
            nock(/\d+\.\d+\.\d+\.\d+/)
                .get("/api/transactions/e4311204acf8a86ba833e494f5292475c6e9e0913fc455a12601b4b6b55818d8")
                .thrice()
                .reply(404, {
                    statusCode: 404,
                    error: "Not Found",
                    message:
                        "Transaction e4311204acf8a86ba833e494f5292475c6e9e0913fc455a12601b4b6b55818d8 could not be found.",
                });
            const response = await sendRequest(server, "transactions.info", {
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
            const response = await sendRequest(server, "transactions.create", {
                amount: 100000000,
                recipientId: "D61mfSggzbvQgTUe6JhYKH2doHaqJ3Dyib",
                passphrase: "this is a top secret passphrase",
            });

            expect(response.body.result.recipientId).toBe("D61mfSggzbvQgTUe6JhYKH2doHaqJ3Dyib");
            expect(verifyTransaction(response.body.result)).toBeTrue();
        });

        it("should create a new transaction with a vendor field and verify", async () => {
            const response = await sendRequest(server, "transactions.create", {
                amount: 100000000,
                passphrase: "this is a top secret passphrase",
                recipientId: "D61mfSggzbvQgTUe6JhYKH2doHaqJ3Dyib",
                vendorField: "Hello World",
            });

            expect(response.body.result.recipientId).toBe("D61mfSggzbvQgTUe6JhYKH2doHaqJ3Dyib");
            expect(response.body.result.vendorField).toBe("Hello World");
            expect(verifyTransaction(response.body.result)).toBeTrue();
        });

        it("should return 422 if it fails to verify the transaction", async () => {
            const spyVerify = jest.spyOn(Transactions.Verifier, "verifyHash").mockImplementation(() => false);

            const response = await sendRequest(server, "transactions.create", {
                amount: 100000000,
                recipientId: "D61mfSggzbvQgTUe6JhYKH2doHaqJ3Dyib",
                passphrase: "this is a top secret passphrase",
            });

            expect(response.body.error.code).toBe(422);
            expect(spyVerify).toHaveBeenCalled();
        });
    });

    describe("POST transactions.broadcast", () => {
        it("should broadcast the transaction", async () => {
            const transaction = await sendRequest(server, "transactions.create", {
                amount: 100000000,
                recipientId: "D61mfSggzbvQgTUe6JhYKH2doHaqJ3Dyib",
                passphrase: "this is a top secret passphrase",
            });

            nock(/\d+\.\d+\.\d+\.\d+/)
                .post("/api/transactions")
                .reply(200, {
                    data: {
                        accepted: [transaction.id],
                    },
                });

            const response = await sendRequest(server, "transactions.broadcast", {
                id: transaction.body.result.id,
            });

            expect(verifyTransaction(response.body.result)).toBeTrue();
        });

        it("should fail to broadcast the transaction", async () => {
            const response = await sendRequest(server, "transactions.broadcast", {
                id: "e4311204acf8a86ba833e494f5292475c6e9e0913fc455a12601b4b6b55818d8",
            });

            expect(response.body.error.code).toBe(404);
            expect(response.body.error.message).toBe(
                "Transaction e4311204acf8a86ba833e494f5292475c6e9e0913fc455a12601b4b6b55818d8 could not be found.",
            );
        });

        it("should return 422 if it fails to verify the transaction", async () => {
            const transaction = await sendRequest(server, "transactions.create", {
                amount: 100000000,
                recipientId: "D61mfSggzbvQgTUe6JhYKH2doHaqJ3Dyib",
                passphrase: "this is a top secret passphrase",
            });

            const spyVerify: jest.SpyInstance = jest
                .spyOn(Transactions.Verifier, "verifyHash")
                .mockImplementation(() => false);

            const response = await sendRequest(server, "transactions.broadcast", {
                id: transaction.body.result.id,
            });

            expect(response.body.error.code).toBe(422);
            expect(spyVerify).toHaveBeenCalled();
        });
    });

    describe("POST transactions.bip38.create", () => {
        const userId: string = randomBytes(32).toString("hex");

        it("should create a new transaction", async () => {
            await sendRequest(server, "wallets.bip38.create", {
                bip38: "this is a top secret passphrase",
                userId,
            });

            const response = await sendRequest(server, "transactions.bip38.create", {
                bip38: "this is a top secret passphrase",
                userId,
                amount: 1000000000,
                recipientId: "D61mfSggzbvQgTUe6JhYKH2doHaqJ3Dyib",
            });

            expect(response.body.result.recipientId).toBe("D61mfSggzbvQgTUe6JhYKH2doHaqJ3Dyib");
            expect(verifyTransaction(response.body.result)).toBeTrue();
        });

        it("should create a new transaction with a vendor field", async () => {
            const response = await sendRequest(server, "transactions.bip38.create", {
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

        it("should fail to create a new transaction", async () => {
            const response = await sendRequest(server, "transactions.bip38.create", {
                bip38: "this is a top secret passphrase",
                userId: "123456789",
                amount: 1000000000,
                recipientId: "D61mfSggzbvQgTUe6JhYKH2doHaqJ3Dyib",
            });

            expect(response.body.error.code).toBe(404);
            expect(response.body.error.message).toBe("User 123456789 could not be found.");
        });

        it("should return 422 if it fails to verify the transaction", async () => {
            const spyVerify: jest.SpyInstance = jest
                .spyOn(Transactions.Verifier, "verifyHash")
                .mockImplementation(() => false);

            const response = await sendRequest(server, "transactions.bip38.create", {
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
