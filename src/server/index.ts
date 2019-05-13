import { Types } from "@arkecosystem/crypto";
import * as rpc from "@faustbrian/hapi-json-rpc";
import * as whitelist from "@faustbrian/hapi-whitelist";
import { Server } from "@hapi/hapi";
import { logger } from "../services/logger";
import { network } from "../services/network";
import { methods } from "./methods";

export async function startServer(options: Record<string, string | number | boolean>): Promise<Server> {
    if (options.allowRemote) {
        logger.warn("JSON-RPC server allows remote connections, this is a potential security risk");
    }

    const server = new Server({
        host: options.host as string,
        port: options.port as number,
    });

    if (!options.allowRemote) {
        await server.register({
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
        },
    });

    try {
        await network.init({ network: options.network as Types.NetworkName, peer: options.peer as string });

        await server.start();

        logger.info(`JSON-RPC Server running on ${server.info.uri}`);
    } catch (error) {
        logger.error(error.message);

        process.exit(1);
    }

    return server;
}
