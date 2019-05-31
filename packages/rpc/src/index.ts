import { Server } from "@hapi/hapi";
import { startServer } from "./server";
import { database as db } from "./services/database";
import { logger } from "./services/logger";

export * from "./interfaces";

export const start = async (options: {
    database: string;
    server: Record<string, any>;
    logger?: any;
}): Promise<Server> => {
    db.connect(options.database);

    if (options.logger) {
        logger.setLogger(options.logger);
    }

    return startServer(options.server);
};
