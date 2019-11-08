import "jest-extended";

import { Identities } from "@arkecosystem/crypto";
import { Server } from "@hapi/hapi";
import { launchServer, sendRequest } from "../__support__";

let server: Server;
beforeAll(async () => (server = await launchServer()));
afterAll(async () => server.stop());

describe("Wallets", () => {
    describe("POST wallets.info", () => {
        it("should get information about the given wallet", async () => {
            const response = await sendRequest("wallets.info", {
                address: "D6Z26L69gdk9qYmTv5uzk3uGepigtHY4ax",
            });

            expect(response.body.result.address).toBe("D6Z26L69gdk9qYmTv5uzk3uGepigtHY4ax");
        });

        it("should fail to get information about the given wallet", async () => {
            const address: string = Identities.Address.fromPassphrase(Math.random().toString(36));

            const response = await sendRequest("wallets.info", { address });

            expect(response.body.error.code).toBe(404);
            expect(response.body.error.message).toBe(`Wallet ${address} could not be found.`);
        });
    });

    describe("POST wallets.transactions", () => {
        it("should get the transactions for the given wallet", async () => {
            jest.setTimeout(20000);

            const response = await sendRequest("wallets.transactions", {
                address: "D6Z26L69gdk9qYmTv5uzk3uGepigtHY4ax",
            });

            expect(response.body.result.data).toBeArray();
            expect(response.body.result.data.length).toBeGreaterThanOrEqual(100);
        });

        it("should fail to get transactions for the given wallet", async () => {
            const address: string = Identities.Address.fromPassphrase(Math.random().toString(36));

            const response = await sendRequest("wallets.transactions", { address });

            expect(response.body.error.code).toBe(404);
            expect(response.body.error.message).toBe(`Wallet ${address} could not be found.`);
        });
    });

    describe("POST wallets.create", () => {
        it("should create a new wallet", async () => {
            const response = await sendRequest("wallets.create", {
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
                const response = await sendRequest("wallets.bip38.create", {
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
                const response = await sendRequest("wallets.bip38.info", {
                    bip38: "this is a top secret passphrase",
                    userId,
                });

                expect(response.body.result).toHaveProperty("address");
                expect(response.body.result).toHaveProperty("publicKey");
                expect(response.body.result).toHaveProperty("wif");
                expect(response.body.result.wif).toBe(bip38wif);
            });

            it("should fail to find the wallet for the given userId", async () => {
                const response = await sendRequest("wallets.bip38.info", {
                    bip38: "invalid",
                    userId: "123456789",
                });

                expect(response.body.error.code).toBe(404);
                expect(response.body.error.message).toBe("User 123456789 could not be found.");
            });
        });
    });
});
