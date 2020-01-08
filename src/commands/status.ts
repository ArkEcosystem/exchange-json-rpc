import { flags } from "@oclif/parser";
import Table from "cli-table3";
import dayjs from "dayjs";
import prettyBytes from "pretty-bytes";
import prettyMs from "pretty-ms";
import { processManager } from "../process-manager";
import { CommandFlags } from "../types";
import { ProcessDescription } from "../types";
import { renderTable } from "../utils";
import { BaseCommand } from "./command";

export class StatusCommand extends BaseCommand {
    public static description: string = "Show the JSON-RPC status";

    public static examples: string[] = [`$ exchange-json-rpc status`];

    public static flags: CommandFlags = {
        token: flags.string({
            description: "the name of the token that should be used",
            default: "ark",
        }),
    };

    public async run(): Promise<void> {
        const { flags } = await this.parseWithNetwork(StatusCommand);

        const processName: string = this.getProcessName(flags.token);

        this.abortMissingProcess(processName);

        renderTable(["ID", "Name", "Version", "Status", "Uptime", "CPU", "RAM"], (table: Table.Table) => {
            const app: ProcessDescription = processManager.describe(processName);

            // @ts-ignore
            table.push([
                app.pid,
                app.name,
                // @ts-ignore
                app.pm2_env.version,
                app.pm2_env.status,
                // @ts-ignore
                prettyMs(dayjs().diff(app.pm2_env.pm_uptime)),
                `${app.monit.cpu}%`,
                prettyBytes(app.monit.memory),
            ]);
        });
    }
}
