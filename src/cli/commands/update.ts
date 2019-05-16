import { flags } from "@oclif/command";
import Chalk from "chalk";
import cli from "cli-ux";
import { removeSync } from "fs-extra";
import { confirm } from "../helpers/prompts";
import { checkForUpdates, installFromChannel } from "../helpers/update";
import { CommandFlags } from "../types";
import { BaseCommand } from "./command";

export class UpdateCommand extends BaseCommand {
    public static description: string = "Update the exchange-json-rpc installation";

    public static flags: CommandFlags = {
        ...BaseCommand.flagsNetwork,
        force: flags.boolean({
            description: "force an update",
        }),
        restart: flags.boolean({
            description: "restart all running processes",
            allowNo: true,
        }),
    };

    public async run(): Promise<void> {
        const state = await checkForUpdates(this);

        if (!state.ready) {
            this.log(`You already have the latest version (${state.currentVersion})`);

            return;
        }

        const { flags } = await this.parseWithNetwork(UpdateCommand);

        if (flags.force) {
            return this.performUpdate(flags, state);
        }

        try {
            this.warn(
                `${state.name} update available from ${Chalk.greenBright(state.currentVersion)} to ${Chalk.greenBright(
                    state.updateVersion,
                )}.`,
            );

            await confirm("Would you like to update?", async () => {
                try {
                    await this.performUpdate(flags, state);
                } catch (err) {
                    this.error(err.message);
                } finally {
                    cli.action.stop();
                }
            });
        } catch (err) {
            this.error(err.message);
        }
    }

    private async performUpdate(flags: CommandFlags, state: Record<string, any>): Promise<void> {
        cli.action.start(`Updating from ${state.currentVersion} to ${state.updateVersion}`);

        await installFromChannel(state.name, state.updateVersion);

        cli.action.stop();

        removeSync(state.cache);

        this.warn(`Version ${state.updateVersion} has been installed.`);

        await this.restartRunningProcessPrompt(this.getProcessName(flags.token), !flags.restart);
    }
}
