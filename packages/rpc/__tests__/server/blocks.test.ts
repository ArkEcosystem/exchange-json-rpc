import "jest-extended";

import { Server } from "@hapi/hapi";
import nock from "nock";
import { launchServer, sendRequest } from "../__support__";

let server: Server;

beforeAll(async () => (server = await launchServer()));

afterEach(() => jest.restoreAllMocks());

describe("Blocks", () => {
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

    describe("POST blocks.latest", () => {
        it("should get the latest block", async () => {
            nock(/\d+\.\d+\.\d+\.\d+/)
                .get("/api/blocks?orderBy=height%3Adesc&limit=1")
                .reply(200, {
                    data: [
                        {
                            id: "eadea76d383aab4f5b807a1954ecb792b9a5f3b3c901e351627a91681713728c",
                        },
                    ],
                });

            const response = await sendRequest(server, "blocks.latest");

            expect(response.body.result.id).toBeString();
        });
    });

    describe("POST blocks.info", () => {
        it("should get the block information", async () => {
            nock(/\d+\.\d+\.\d+\.\d+/)
                .get("/api/blocks/13114381566690093367")
                .reply(200, {
                    data: {
                        id: "13114381566690093367",
                    },
                });

            const response = await sendRequest(server, "blocks.info", {
                id: "13114381566690093367",
            });

            expect(response.body.result.id).toBe("13114381566690093367");
        });

        it("should fail to get the block information", async () => {
            nock(/\d+\.\d+\.\d+\.\d+/)
                .get("/api/blocks/66af2f6ccd37bbd4b967d48eb13e6b7e411c0d287e2f70308af9dc69b4322362")
                .thrice()
                .reply(404, {
                    statusCode: 404,
                    error: "Not Found",
                    message:
                        "Block 66af2f6ccd37bbd4b967d48eb13e6b7e411c0d287e2f70308af9dc69b4322362 could not be found.",
                });

            const response = await sendRequest(server, "blocks.info", {
                id: "66af2f6ccd37bbd4b967d48eb13e6b7e411c0d287e2f70308af9dc69b4322362",
            });

            expect(response.body.error.code).toBe(404);
            expect(response.body.error.message).toBe(
                "Block 66af2f6ccd37bbd4b967d48eb13e6b7e411c0d287e2f70308af9dc69b4322362 could not be found.",
            );
        });
    });

    describe("POST blocks.transactions", () => {
        it("should get the block transactions", async () => {
            nock(/\d+\.\d+\.\d+\.\d+/)
                .get("/api/blocks/13114381566690093367/transactions?orderBy=timestamp%3Adesc")
                .reply(200, {
                    meta: {
                        totalCountIsEstimate: false,
                        count: 0,
                        pageCount: 1,
                        totalCount: 0,
                        next: null,
                        previous: null,
                        self:
                            "/api/blocks/99816b312b7d84f5f2be2567f067a143102fc2e6a631b32fc130e92121733f1c/transactions?transform=true&page=1&limit=100",
                        first:
                            "/api/blocks/99816b312b7d84f5f2be2567f067a143102fc2e6a631b32fc130e92121733f1c/transactions?transform=true&page=1&limit=100",
                        last: null,
                    },
                    data: new Array(52).fill(0),
                });

            const response = await sendRequest(server, "blocks.transactions", {
                id: "13114381566690093367",
            });

            expect(response.body.result.data).toHaveLength(52);
        });

        it("should fail to get the block transactions", async () => {
            nock(/\d+\.\d+\.\d+\.\d+/)
                .get(
                    "/api/blocks/66af2f6ccd37bbd4b967d48eb13e6b7e411c0d287e2f70308af9dc69b4322362/transactions?orderBy=timestamp%3Adesc",
                )
                .thrice()
                .reply(404, {
                    statusCode: 404,
                    error: "Not Found",
                    message:
                        "Block 66af2f6ccd37bbd4b967d48eb13e6b7e411c0d287e2f70308af9dc69b4322362 could not be found.",
                });

            const response = await sendRequest(server, "blocks.transactions", {
                id: "66af2f6ccd37bbd4b967d48eb13e6b7e411c0d287e2f70308af9dc69b4322362",
            });

            expect(response.body.error.code).toBe(404);
            expect(response.body.error.message).toBe(
                "Block 66af2f6ccd37bbd4b967d48eb13e6b7e411c0d287e2f70308af9dc69b4322362 could not be found.",
            );
        });
    });
});
