import { flags } from "@oclif/command";
import cli from "cli-ux";
import { processManager } from "../process-manager";
import { CommandFlags } from "../types";
import { BaseCommand } from "./command";

export class StopCommand extends BaseCommand {
    public static description: string = "Stop the relay";

    public static examples: string[] = [
        `Stop the relay
$ exchange-json-rpc relay:stop
`,
        `Stop the relay daemon
$ exchange-json-rpc relay:stop --daemon
`,
    ];

    public static flags: CommandFlags = {
        ...BaseCommand.flagsNetwork,
        daemon: flags.boolean({
            description: "stop the process or daemon",
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

            processManager[flags.daemon ? "delete" : "stop"](processName);
        } catch (error) {
            this.error(error.message);
        } finally {
            cli.action.stop();
        }
    }
}
