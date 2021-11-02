import "jest-extended";

import { Transactions } from "@arkecosystem/crypto";
import { BigNumber } from "@arkecosystem/crypto/dist/utils";
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
    nock('https://ark-test.payvo.com:443')
        .persist()
        .get("/api/peers")
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
        .get("/api/node/fees?days=30")
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

    const blockchainNock = nock('https://ark-test.payvo.com:443')
        .persist()
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
            nock('https://ark-test.payvo.com:443')
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
            nock('https://ark-test.payvo.com:443')
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
        it("should create a new transfer and verify", async () => {
            const response = await sendRequest(server, "transactions.create", {
                amount: 100000000,
                recipientId: "D61mfSggzbvQgTUe6JhYKH2doHaqJ3Dyib",
                passphrase: "this is a top secret passphrase",
            });

            expect(response.body.result.recipientId).toBe("D61mfSggzbvQgTUe6JhYKH2doHaqJ3Dyib");
            expect(verifyTransaction(response.body.result)).toBeTrue();
        });

        it("should add a nonce if aip11 is enabled", async () => {
            const response = await sendRequest(server, "transactions.create", {
                amount: 100000000,
                recipientId: "D61mfSggzbvQgTUe6JhYKH2doHaqJ3Dyib",
                passphrase: "this is a top secret passphrase",
            });

            expect(response.body.result.recipientId).toBe("D61mfSggzbvQgTUe6JhYKH2doHaqJ3Dyib");
            expect(response.body.result.nonce.toString()).toBe("2");
            expect(verifyTransaction(response.body.result)).toBeTrue();
        });

        it("should create a new transfer with a vendor field and verify", async () => {
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

    describe("POST transactions.delegateRegistration.create", () => {
        it("should create a new delegate registration and verify", async () => {
            const response = await sendRequest(server, "transactions.delegateRegistration.create", {
                username: "boldninja",
                passphrase: "this is a top secret passphrase",
            });

            expect(response.body.result.asset.delegate.username).toBe("boldninja");
            expect(verifyTransaction(response.body.result)).toBeTrue();
        });

        it("should return 422 if it fails to verify the transaction", async () => {
            const spyVerify = jest.spyOn(Transactions.Verifier, "verifyHash").mockImplementation(() => false);

            const response = await sendRequest(server, "transactions.delegateRegistration.create", {
                username: "boldninja",
                passphrase: "this is a top secret passphrase",
            });

            expect(response.body.error.code).toBe(422);
            expect(spyVerify).toHaveBeenCalled();
        });
    });

    describe("POST transactions.vote.create", () => {
        it("should create a new vote and verify", async () => {
            const response = await sendRequest(server, "transactions.vote.create", {
                publicKey: "023ee98f453661a1cb765fd60df95b4efb1e110660ffb88ae31c2368a70f1f7359",
                passphrase: "this is a top secret passphrase",
            });

            expect(response.body.result.asset.votes).toEqual([
                "+023ee98f453661a1cb765fd60df95b4efb1e110660ffb88ae31c2368a70f1f7359",
            ]);
            expect(verifyTransaction(response.body.result)).toBeTrue();
        });

        it("should return 422 if it fails to verify the transaction", async () => {
            const spyVerify = jest.spyOn(Transactions.Verifier, "verifyHash").mockImplementation(() => false);

            const response = await sendRequest(server, "transactions.vote.create", {
                publicKey: "023ee98f453661a1cb765fd60df95b4efb1e110660ffb88ae31c2368a70f1f7359",
                passphrase: "this is a top secret passphrase",
            });

            expect(response.body.error.code).toBe(422);
            expect(spyVerify).toHaveBeenCalled();
        });
    });

    describe("POST transactions.unvote.create", () => {
        it("should create a new unvote and verify", async () => {
            const response = await sendRequest(server, "transactions.unvote.create", {
                publicKey: "023ee98f453661a1cb765fd60df95b4efb1e110660ffb88ae31c2368a70f1f7359",
                passphrase: "this is a top secret passphrase",
            });

            expect(response.body.result.asset.votes).toEqual([
                "-023ee98f453661a1cb765fd60df95b4efb1e110660ffb88ae31c2368a70f1f7359",
            ]);
            expect(verifyTransaction(response.body.result)).toBeTrue();
        });

        it("should return 422 if it fails to verify the transaction", async () => {
            const spyVerify = jest.spyOn(Transactions.Verifier, "verifyHash").mockImplementation(() => false);

            const response = await sendRequest(server, "transactions.unvote.create", {
                publicKey: "023ee98f453661a1cb765fd60df95b4efb1e110660ffb88ae31c2368a70f1f7359",
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

            nock('https://ark-test.payvo.com:443')
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

        it("should not add a nonce if aip11 is not enabled", async () => {
            blockchainNock.persist(false);
            nock.abortPendingRequests();

            nock('https://ark-test.payvo.com:443')
                .persist()
                .get("/api/blockchain")
                .reply(200, {
                    data: {
                        block: {
                            height: 1,
                            id: "aa6f13f08e32db84991ec8a7b19558b99027eac2d02920d19ded2222a55fba0a",
                        },
                        supply: "14625386000000004",
                    },
                });

            const newServer = await createServer(); // Need to initialize it again to set the height
            const response = await sendRequest(newServer, "transactions.create", {
                amount: 100000000,
                recipientId: "D61mfSggzbvQgTUe6JhYKH2doHaqJ3Dyib",
                passphrase: "this is a top secret passphrase",
            });

            expect(response.body.result.recipientId).toBe("D61mfSggzbvQgTUe6JhYKH2doHaqJ3Dyib");
            expect(response.body.result.nonce).toBe(BigNumber.ZERO);
            expect(verifyTransaction(response.body.result)).toBeTrue();
        });
    });
});
