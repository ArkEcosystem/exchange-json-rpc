import cli from "cli-ux";
import { processManager } from "../process-manager";
import { CommandFlags } from "../types";
import { BaseCommand } from "./command";

export class RestartCommand extends BaseCommand {
    public static description: string = "Restart the relay";

    public static examples: string[] = [
        `Restart the relay
$ exchange-json-rpc relay:restart
`,
    ];

    public static flags: CommandFlags = {
        ...BaseCommand.flagsNetwork,
    };

    public async run(): Promise<void> {
        const { flags } = await this.parseWithNetwork(RestartCommand);

        const processName: string = this.getProcessName(flags.token);

        try {
            this.abortMissingProcess(processName);
            this.abortStoppedProcess(processName);

            cli.action.start(`Restarting ${processName}`);

            processManager.restart(processName);
        } catch (error) {
            error.stderr ? this.error(`${error.message}: ${error.stderr}`) : this.error(error.message);
        } finally {
            cli.action.stop();
        }
    }
}
