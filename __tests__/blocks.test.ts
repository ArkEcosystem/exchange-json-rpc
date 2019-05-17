import "jest-extended";

import { Server } from "@hapi/hapi";
import { launchServer, sendRequest } from "./__support__";

let server: Server;
beforeAll(async () => (server = await launchServer()));
afterAll(async () => server.stop());

describe("Blocks", () => {
    describe("POST blocks.latest", () => {
        it("should get the latest block", async () => {
            const response = await sendRequest("blocks.latest");

            expect(response.body.result.id).toBeString();
        });
    });

    describe("POST blocks.info", () => {
        it("should get the block information", async () => {
            const response = await sendRequest("blocks.info", {
                id: "13114381566690093367",
            });

            expect(response.body.result.id).toBe("13114381566690093367");
        });

        it("should fail to get the block information", async () => {
            const response = await sendRequest("blocks.info", { id: "fake" });

            expect(response.body.error.code).toBe(404);
            expect(response.body.error.message).toBe("Block fake could not be found.");
        });
    });

    describe("POST blocks.transactions", () => {
        it("should get the block transactions", async () => {
            const response = await sendRequest("blocks.transactions", {
                id: "13114381566690093367",
            });

            expect(response.body.result.data).toHaveLength(52);
        });

        it("should fail to get the block transactions", async () => {
            const response = await sendRequest("blocks.transactions", { id: "fake" });

            expect(response.body.error.code).toBe(404);
            expect(response.body.error.message).toBe("Block fake could not be found.");
        });
    });
});
