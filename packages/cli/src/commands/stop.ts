import { flags } from "@oclif/command";
import cli from "cli-ux";
import { processManager } from "../process-manager";
import { CommandFlags } from "../types";
import { BaseCommand } from "./command";

export class StopCommand extends BaseCommand {
    public static description: string = "Stop the JSON-RPC";

    public static examples: string[] = [
        `Stop the JSON-RPC
$ exchange-json-rpc stop
`,
    ];

    public static flags: CommandFlags = {
        ...BaseCommand.flagsNetwork,
        kill: flags.boolean({
            description: "kill the process or daemon",
        }),
    };

    public async run(): Promise<void> {
        const { flags } = await this.parseWithNetwork(StopCommand);

        const processName: string = this.getProcessName(flags.token);

        try {
            this.abortMissingProcess(processName);
            this.abortUnknownProcess(processName);
            this.abortStoppedProcess(processName);

            cli.action.start(`Stopping ${processName}`);

            processManager[flags.kill ? "delete" : "stop"](processName);
        } catch (error) {
            this.error(error.message);
        } finally {
            cli.action.stop();
        }
    }
}
