import { Server } from "@hapi/hapi";
import { startServer } from "./server";
import { database as db } from "./services/database";

export * from "./interfaces";

export const start = async ({
    database,
    server,
}: {
    database: string;
    server: Record<string, any>;
}): Promise<Server> => {
    db.connect(database);

    return startServer(server);
};
