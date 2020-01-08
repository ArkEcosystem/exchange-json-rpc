import { startServer } from "../server";
import { database as db } from "../services/database";
import { logger } from "../services/logger";
import { CommandFlags } from "../types";
import { BaseCommand } from "./command";

export class RunCommand extends BaseCommand {
    public static description: string = "Run the JSON-RPC (without pm2)";

    public static examples: string[] = [
        `Run the JSON-RPC
$ exchange-json-rpc run
`,
    ];

    public static flags: CommandFlags = {
        ...BaseCommand.flagsNetwork,
        ...BaseCommand.flagsConfiguration,
    };

    public async run(): Promise<void> {
        const { flags, paths } = await this.parseWithNetwork(RunCommand);

        flags.whitelist = flags.whitelist.split(",");

        db.connect(`${paths.data}/exchange-json-rpc.sqlite`);

        if (flags.logger) {
            logger.setLogger(flags.logger);
        }

        await startServer(flags.server);
    }
}
