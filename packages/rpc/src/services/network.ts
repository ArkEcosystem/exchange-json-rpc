import { Managers, Types } from "@arkecosystem/crypto";
import got from "got";
import { logger } from "./logger";

class Network {
    private options: { network: Types.NetworkName; peer: string; };

    public async init(options: {
        network: Types.NetworkName;
        peer: string;
    }): Promise<void> {
        this.options = options;

        Managers.configManager.setFromPreset(options.network);

        this.checkForAip11Enabled();
    }

    public async sendGET({ path, query = {} }: { path: string; query?: Record<string, any> }) {
        return this.sendRequest("get", path, { query });
    }

    public async sendPOST({ path, body = {} }: { path: string; body: Record<string, any> }) {
        return this.sendRequest("post", path, { body });
    }

    public async getHeight(): Promise<number> {
        return (await this.sendGET({ path: "blockchain" })).data.block.height;
    }

    private async checkForAip11Enabled() {
        const height = await this.getHeight();
        Managers.configManager.setHeight(height);

        const milestone = Managers.configManager.getMilestone(height);
        if (!milestone.aip11) {
            setTimeout(() => this.checkForAip11Enabled(), milestone.blocktime * 1000);
        }
    }

    private async sendRequest(method: string, url: string, options, tries: number = 0, useSeed: boolean = false) {
        try {
            const uri: string = `${this.getPeer()}/api/${url}`;

            logger.info(`Sending request on "${this.options.network}" to "${uri}"`);

            if (options.body && typeof options.body !== "string") {
                options.body = JSON.stringify(options.body);
            }

            const { body } = await got[method](uri, {
                ...options,
                ...{
                    headers: {
                        Accept: "application/vnd.core-api.v2+json",
                        "Content-Type": "application/json",
                    },
                    timeout: 3000,
                },
            });

            return JSON.parse(body);
        } catch (error) {
            logger.error(error.message);

            tries++;

            if (tries > 2) {
                logger.error(`Failed to find a responsive peer after 3 tries.`);
                return undefined;
            }

            return this.sendRequest(method, url, options, tries);
        }
    }

    private getPeer(): string {
        if (this.options.peer) {
            return this.options.peer;
        }

        if (this.options.network === "mainnet") {
            return "https://ark-live.payvo.com";
        }

        return "https://ark-test.payvo.com";
    }
}

export const network = new Network();
