import { Networks } from "@arkecosystem/crypto";
import Command, { flags } from "@oclif/command";
import cli from "cli-ux";
import envPaths, { Paths } from "env-paths";
import { ensureDirSync } from "fs-extra";
import { confirm } from "../helpers/prompts";
import { processManager } from "../process-manager";
import { CommandFlags } from "../types";

const validNetworks = Object.keys(Networks).filter(network => network !== "unitnet");

export abstract class BaseCommand extends Command {
    public static flagsNetwork: Record<string, object> = {
        network: flags.string({
            description: "the name of the network that should be used",
            options: validNetworks,
            default: "devnet",
        }),
        token: flags.string({
            description: "the name of the token that should be used",
            default: "ark",
        }),
        host: flags.string({
            description: "the name of the network that should be used",
            default: "0.0.0.0",
        }),
        port: flags.integer({
            description: "the name of the network that should be used",
            default: 8080,
        }),
        allowRemote: flags.boolean({
            description: "the name of the network that should be used",
            allowNo: true,
            default: false,
        }),
        whitelist: flags.string({
            description: "the name of the network that should be used",
            default: "127.0.0.1,::ffff:127.0.0.1",
        }),
        peer: flags.string({
            description: "the peer you want to use for communication, defaults to random network peers",
        }),
    };

    protected flagsToStrings(flags: CommandFlags, ignoreKeys: string[] = []): string {
        const mappedFlags = [];

        for (const [key, value] of Object.entries(flags)) {
            if (!ignoreKeys.includes(key) && value !== undefined) {
                if (value === false) {
                    continue;
                } else if (value === true) {
                    mappedFlags.push(`--${key}`);
                } else if (typeof value === "string") {
                    mappedFlags.push(value.includes(" ") ? `--${key}="${value}"` : `--${key}=${value}`);
                } else {
                    mappedFlags.push(`--${key}=${value}`);
                }
            }
        }

        return mappedFlags.join(" ");
    }

    protected async getPaths(flags: CommandFlags): Promise<Paths> {
        const paths: Paths = this.getEnvPaths(flags);

        for (const [key, value] of Object.entries(paths)) {
            paths[key] = `${value}/${flags.network}`;

            ensureDirSync(paths[key]);
        }

        return paths;
    }

    protected async parseWithNetwork(command: any): Promise<any> {
        const { args, flags } = this.parse(command);

        return { args, flags, paths: await this.getPaths(flags) };
    }

    protected abortWithInvalidInput(): void {
        this.error("Please enter valid data and try again!");
    }

    protected getNetworks(): string[] {
        return validNetworks;
    }

    protected isValidNetwork(network: string): boolean {
        return this.getNetworks().includes(network);
    }

    protected getNetworksForPrompt(): any {
        return this.getNetworks().map(network => ({ title: network, value: network }));
    }

    protected async restartRunningProcessPrompt(processName: string, showPrompt: boolean = true) {
        if (processManager.isOnline(processName)) {
            if (showPrompt) {
                await confirm(`Would you like to restart the ${processName} process?`, () => {
                    this.restartProcess(processName);
                });
            } else {
                this.restartProcess(processName);
            }
        }
    }

    protected restartProcess(processName: string): void {
        try {
            cli.action.start(`Restarting ${processName}`);

            processManager.restart(processName);
        } catch (error) {
            error.stderr ? this.error(`${error.message}: ${error.stderr}`) : this.error(error.message);
        } finally {
            cli.action.stop();
        }
    }

    protected abortRunningProcess(processName: string) {
        if (processManager.isOnline(processName)) {
            this.error(`The "${processName}" process is already running.`);
        }
    }

    protected abortStoppedProcess(processName: string) {
        if (processManager.isStopped(processName)) {
            this.error(`The "${processName}" process is not running.`);
        }
    }

    protected abortErroredProcess(processName: string) {
        if (processManager.isErrored(processName)) {
            this.error(`The "${processName}" process has errored.`);
        }
    }

    protected abortUnknownProcess(processName: string) {
        if (processManager.isUnknown(processName)) {
            this.error(
                `The "${processName}" process has entered an unknown state. (${processManager.status(processName)})`,
            );
        }
    }

    protected abortMissingProcess(processName: string) {
        if (processManager.missing(processName)) {
            this.error(`The "${processName}" process does not exist.`);
        }
    }

    protected getProcessName(token: string): string {
        return `${token}-json-rpc`;
    }

    private getEnvPaths(flags: CommandFlags): Paths {
        return envPaths(flags.token, { suffix: "ark-json-rpc" });
    }
}
