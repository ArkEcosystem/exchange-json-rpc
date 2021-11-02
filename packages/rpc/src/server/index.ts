import { Types, Validation } from "@arkecosystem/crypto";
import { Server } from "@hapi/hapi";
import * as rpc from "@hapist/json-rpc";
import * as whitelist from "@hapist/whitelist";
import { logger } from "../services/logger";
import { network } from "../services/network";
import { methods } from "./methods";

export async function startServer(
    options: Record<string, string | number | boolean>,
    onlyCreate?: boolean,
): Promise<Server> {
    if (options.allowRemote) {
        logger.warn("Server allows remote connections. This is a potential security risk!");
    }

    const server = new Server({
        host: options.host as string,
        port: options.port as number,
    });

    if (!options.allowRemote) {
        await server.register({
            // @ts-ignore
            plugin: whitelist,
            options: {
                whitelist: options.whitelist,
            },
        });
    }

    await server.register({
        // @ts-ignore
        plugin: rpc,
        options: {
            methods,
            processor: {
                schema: {
                    properties: {
                        id: {
                            type: ["number", "string"],
                        },
                        jsonrpc: {
                            pattern: "2.0",
                            type: "string",
                        },
                        method: {
                            type: "string",
                        },
                        params: {
                            type: "object",
                        },
                    },
                    required: ["jsonrpc", "method", "id"],
                    type: "object",
                },
                validate(data: object, schema: object) {
                    try {
                        const { error } = Validation.validator.validate(schema, data);
                        return { value: data, error: error ? error : null };
                    } catch (error) {
                        return { value: null, error: error.stack };
                    }
                },
            },
        },
    });

    await network.init({
        network: options.network as Types.NetworkName,
        peer: options.peer as string,
    });

    if (!onlyCreate) {
        await server.start();

        logger.info(`Exchange JSON-RPC running on ${server.info.uri}`);
    }

    return server;
}
