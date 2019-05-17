import { httpie } from "@arkecosystem/core-utils";
import { Managers, Types } from "@arkecosystem/crypto";
import isReachable from "is-reachable";
import sample from "lodash.sample";
import { logger } from "./logger";

class Network {
    private opts: { network: string; peer: string };

    public async init(opts: { network: Types.NetworkName; peer: string }) {
        this.opts = opts;

        Managers.configManager.setFromPreset(opts.network);
    }

    public async sendGET({ path, query = {} }: { path: string; query?: Record<string, any> }) {
        return this.sendRequest("get", path, { query });
    }

    public async sendPOST({ path, body = {} }: { path: string; body: Record<string, any> }) {
        return this.sendRequest("post", path, { body });
    }

    private async sendRequest(method: string, url: string, opts, tries: number = 0) {
        try {
            const peer: { ip: string; port: number } = await this.getPeer();
            const uri: string = `http://${peer.ip}:${peer.port}/api/${url}`;

            logger.info(`Sending request on "${this.opts.network}" to "${uri}"`);

            return (await httpie[method](uri, {
                ...opts,
                ...{
                    headers: {
                        Accept: "application/vnd.core-api.v2+json",
                        "Content-Type": "application/json",
                    },
                    timeout: 3000,
                },
            })).body;
        } catch (error) {
            logger.error(error.message);

            if (tries > 3) {
                logger.error(`Failed to find a responsive peer after 3 tries.`);
                return undefined;
            }

            tries++;

            return this.sendRequest(method, url, opts, tries);
        }
    }

    private async getPeer(): Promise<{ ip: string; port: number }> {
        if (this.opts.peer) {
            return { ip: this.opts.peer, port: 4003 };
        }

        const peer: { ip: string; port: number } = sample(await this.getPeers());
        const reachable: boolean = await isReachable(`${peer.ip}:${peer.port}`);

        if (!reachable) {
            logger.warn(`${peer} is unresponsive. Choosing new peer.`);

            return this.getPeer();
        }

        return peer;
    }

    private async getPeers(): Promise<Array<{ ip: string; port: number }>> {
        const { body } = await httpie.get(
            `https://raw.githubusercontent.com/ArkEcosystem/peers/master/${this.opts.network}.json`,
        );

        if (!body.length) {
            throw new Error("No peers found. Shutting down...");
        }

        for (const peer of body) {
            peer.port = 4003; // @TODO
        }

        return body;
    }
}

export const network = new Network();
