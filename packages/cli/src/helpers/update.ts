import { IConfig } from "@oclif/config";
import cli from "cli-ux";
import { shell } from "execa";
import { closeSync, openSync, statSync } from "fs";
import { ensureDirSync } from "fs-extra";
import latestVersion from "latest-version";
import { join } from "path";
import semver from "semver";

async function getLatestVersion(name: string): Promise<string> {
    try {
        const version: string = await latestVersion(name);

        return version;
    } catch (error) {
        return undefined;
    }
}

function ensureCacheFile(config: IConfig): string {
    ensureDirSync(config.cacheDir);

    const fileName = join(config.cacheDir, "update");

    closeSync(openSync(fileName, "w"));

    return fileName;
}

export async function installFromChannel(pkg, tag) {
    const { stdout, stderr } = await shell(`yarn global add ${pkg}@${tag}`);

    if (stderr) {
        console.error(stderr);
    }

    console.log(stdout);
}

export function needsRefresh(config: IConfig): boolean {
    const cacheFile: string = ensureCacheFile(config);

    try {
        const { mtime } = statSync(cacheFile);
        const staleAt: Date = new Date(mtime.valueOf() + 1000 * 60 * 60 * 24 * 1);

        return staleAt < new Date();
    } catch (err) {
        return true;
    }
}

export async function checkForUpdates({ config, error, warn }): Promise<any> {
    const state = {
        ready: false,
        name: config.name,
        currentVersion: config.version,
    };

    try {
        const cacheFile: string = ensureCacheFile(config);

        cli.action.start(`Checking for updates`);
        const latestVersion = await getLatestVersion(state.name);
        cli.action.stop();

        if (latestVersion === undefined) {
            error(`We were unable to find any releases.`);

            return state;
        }

        if (semver.gt(latestVersion, config.version)) {
            return {
                ...state,
                ...{
                    ready: true,
                    updateVersion: latestVersion,
                    cache: cacheFile,
                },
            };
        }
    } catch (err) {
        error(err.message);
    } finally {
        cli.action.stop();
    }

    return state;
}
