import { Types } from "@arkecosystem/crypto";
import { Server } from "@hapi/hapi";
import * as rpc from "@hapist/json-rpc";
import * as whitelist from "@hapist/whitelist";
import Ajv from "ajv";
import { logger } from "../services/logger";
import { network } from "../services/network";
import { methods } from "./methods";

export async function startServer(options: Record<string, string | number | boolean>): Promise<Server> {
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
                whitelist: (options.whitelist as string).split(","),
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
                        const ajv = new Ajv({
                            $data: true,
                            extendRefs: true,
                            removeAdditional: true,
                        });

                        ajv.validate(schema, data);

                        return { value: data, error: ajv.errors !== null ? ajv.errorsText() : null };
                    } catch (error) {
                        return { value: null, error: error.stack };
                    }
                },
            },
        },
    });

    try {
        await network.init({ network: options.network as Types.NetworkName, peer: options.peer as string });

        await server.start();

        logger.info(`Server running on ${server.info.uri}`);
    } catch (error) {
        logger.error(error.message);

        process.exit(1);
    }

    return server;
}
