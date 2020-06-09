import { Server } from "@hapi/hapi";
import { tmpdir } from "os";
import { v4 as uuidv4 } from "uuid";
import { startServer } from "../../src/server";
import { database } from "../../src/services/database";

jest.setTimeout(10000);

export const createServer = async (): Promise<Server> => {
    database.connect(`${tmpdir()}/db.sqlite`);

    return startServer(
        {
            host: "0.0.0.0",
            port: 8080,
            allowRemote: false,
            whitelist: ["127.0.0.1", "::ffff:127.0.0.1"] as any,
            network: "devnet",
            peerPort: 4003,
        },
        true,
    );
};

export const sendRequest = async (server: Server, method, params: any = {}) => {
    const id: string = uuidv4();
    const response = await server.inject({
        method: "POST",
        url: "/",
        payload: {
            jsonrpc: "2.0",
            id,
            method,
            params,
        },
        headers: {
            "content-type": "application/vnd.api+json",
        },
    });

    const parsedResponse: Record<string, any> = { body: response.result, statusCode: response.statusCode };

    await expect(parsedResponse.statusCode).toBe(200);
    await expect(parsedResponse.body.jsonrpc).toBe("2.0");
    await expect(parsedResponse.body.id).toBe(id);

    return parsedResponse;
};
