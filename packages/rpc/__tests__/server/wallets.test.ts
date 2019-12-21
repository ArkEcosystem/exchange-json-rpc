import "jest-extended";

import { Identities } from "@arkecosystem/crypto";
import { Server } from "@hapi/hapi";
import nock from "nock";
import { launchServer, sendRequest } from "../__support__";

let server: Server;

beforeAll(async () => (server = await launchServer()));

afterEach(() => jest.restoreAllMocks());

describe("Wallets", () => {
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

    describe("POST wallets.info", () => {
        it("should get information about the given wallet", async () => {
            nock(/\d+\.\d+\.\d+\.\d+/)
                .get("/api/wallets/D6Z26L69gdk9qYmTv5uzk3uGepigtHY4ax")
                .reply(200, {
                    data: {
                        address: "D6Z26L69gdk9qYmTv5uzk3uGepigtHY4ax",
                    },
                });

            const response = await sendRequest(server, "wallets.info", {
                address: "D6Z26L69gdk9qYmTv5uzk3uGepigtHY4ax",
            });

            expect(response.body.result.address).toBe("D6Z26L69gdk9qYmTv5uzk3uGepigtHY4ax");
        });

        it("should fail to get information about the given wallet", async () => {
            const address: string = Identities.Address.fromPassphrase(Math.random().toString(36));

            nock(/\d+\.\d+\.\d+\.\d+/)
                .get(/.*/)
                .thrice()
                .reply(404, {
                    data: {
                        statusCode: 404,
                        error: "Not Found",
                        message: `Wallet ${address} could not be found.`,
                    },
                });

            const response = await sendRequest(server, "wallets.info", { address });

            expect(response.body.error.code).toBe(404);
            expect(response.body.error.message).toBe(`Wallet ${address} could not be found.`);
        });
    });

    describe("POST wallets.transactions", () => {
        it("should get the transactions for the given wallet", async () => {
            nock(/\d+\.\d+\.\d+\.\d+/)
                .get("/api/wallets/D6Z26L69gdk9qYmTv5uzk3uGepigtHY4ax/transactions?offset=0&orderBy=timestamp%3Adesc")
                .reply(200, {
                    meta: {
                        totalCountIsEstimate: false,
                        count: 100,
                        pageCount: 3,
                        totalCount: 259,
                        next:
                            "/api/wallets/D6Z26L69gdk9qYmTv5uzk3uGepigtHY4ax/transactions?transform=true&page=2&limit=100",
                        previous: null,
                        self:
                            "/api/wallets/D6Z26L69gdk9qYmTv5uzk3uGepigtHY4ax/transactions?transform=true&page=1&limit=100",
                        first:
                            "/api/wallets/D6Z26L69gdk9qYmTv5uzk3uGepigtHY4ax/transactions?transform=true&page=1&limit=100",
                        last:
                            "/api/wallets/D6Z26L69gdk9qYmTv5uzk3uGepigtHY4ax/transactions?transform=true&page=3&limit=100",
                    },
                    data: new Array(100).fill(0),
                });

            const response = await sendRequest(server, "wallets.transactions", {
                address: "D6Z26L69gdk9qYmTv5uzk3uGepigtHY4ax",
            });

            expect(response.body.result.data).toBeArray();
            expect(response.body.result.data.length).toBeGreaterThanOrEqual(100);
        });

        it("should fail to get transactions for the given wallet", async () => {
            const address: string = Identities.Address.fromPassphrase(Math.random().toString(36));

            nock(/\d+\.\d+\.\d+\.\d+/)
                .get(`/api/wallets/${address}/transactions?offset=0&orderBy=timestamp%3Adesc`)
                .thrice()
                .reply(404, {
                    data: {
                        statusCode: 404,
                        error: "Not Found",
                        message: `Wallet ${address} could not be found.`,
                    },
                });

            const response = await sendRequest(server, "wallets.transactions", { address });

            expect(response.body.error.code).toBe(404);
            expect(response.body.error.message).toBe(`Wallet ${address} could not be found.`);
        });
    });

    describe("POST wallets.create", () => {
        it("should create a new wallet", async () => {
            nock(/\d+\.\d+\.\d+\.\d+/)
                .get("/api/wallets/D6Z26L69gdk9qYmTv5uzk3uGepigtHY4ax/transactions")
                .reply(200, {
                    data: new Array(100).fill(0),
                });

            const response = await sendRequest(server, "wallets.create", {
                passphrase: "this is a top secret passphrase",
            });

            expect(response.body.result.address).toBe("D61mfSggzbvQgTUe6JhYKH2doHaqJ3Dyib");
            expect(response.body.result.publicKey).toBe(
                "034151a3ec46b5670a682b0a63394f863587d1bc97483b1b6c70eb58e7f0aed192",
            );
        });
    });

    describe("POST wallets.bip38.*", () => {
        let bip38wif;
        const userId = require("crypto")
            .randomBytes(32)
            .toString("hex");

        describe("create", () => {
            it("should create a new wallet", async () => {
                nock(/\d+\.\d+\.\d+\.\d+/)
                    .get("/api/wallets/D6Z26L69gdk9qYmTv5uzk3uGepigtHY4ax/transactions")
                    .reply(200, {
                        data: new Array(100).fill(0),
                    });

                const response = await sendRequest(server, "wallets.bip38.create", {
                    bip38: "this is a top secret passphrase",
                    userId,
                });

                expect(response.body.result).toHaveProperty("address");
                expect(response.body.result).toHaveProperty("publicKey");
                expect(response.body.result).toHaveProperty("wif");

                bip38wif = response.body.result.wif;
            });
        });

        describe("info", () => {
            it("should find the wallet for the given userId", async () => {
                const response = await sendRequest(server, "wallets.bip38.info", {
                    bip38: "this is a top secret passphrase",
                    userId,
                });

                expect(response.body.result).toHaveProperty("address");
                expect(response.body.result).toHaveProperty("publicKey");
                expect(response.body.result).toHaveProperty("wif");
                expect(response.body.result.wif).toBe(bip38wif);
            });

            it("should fail to find the wallet for the given userId", async () => {
                const response = await sendRequest(server, "wallets.bip38.info", {
                    bip38: "invalid",
                    userId: "123456789",
                });

                expect(response.body.error.code).toBe(404);
                expect(response.body.error.message).toBe("User 123456789 could not be found.");
            });
        });
    });
});
