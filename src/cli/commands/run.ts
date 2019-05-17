// import { flags } from "@oclif/command";
import { startServer } from "../../server";
import { database } from "../../services/database";
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
    };

    public async run(): Promise<void> {
        const { flags, paths } = await this.parseWithNetwork(RunCommand);

        database.init(paths.data);

        await startServer(flags);
    }
}
