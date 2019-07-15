import { Managers, Types } from "@arkecosystem/crypto";
import got from "got";
import isReachable from "is-reachable";
import sample from "lodash.sample";
import { IPeer } from "../interfaces";
import { logger } from "./logger";

class Network {
    private opts: { network: string; peer: string };
    private seeds: IPeer[] = [];

    public async init(opts: { network: Types.NetworkName; peer: string }): Promise<void> {
        this.opts = opts;

        Managers.configManager.setFromPreset(opts.network);

        await this.loadSeeds();
    }

    public async sendGET({ path, query = {} }: { path: string; query?: Record<string, any> }) {
        return this.sendRequest("get", path, { query });
    }

    public async sendPOST({ path, body = {} }: { path: string; body: Record<string, any> }) {
        return this.sendRequest("post", path, { body });
    }

    private async sendRequest(method: string, url: string, opts, tries: number = 0, useSeed: boolean = false) {
        try {
            const peer: IPeer = await this.getPeer(useSeed);
            const uri: string = `http://${peer.ip}:${peer.port}/api/${url}`;

            logger.info(`Sending request on "${this.opts.network}" to "${uri}"`);

            if (opts.body && typeof opts.body !== "string") {
                opts.body = JSON.stringify(opts.body);
            }

            const { body } = await got[method](uri, {
                ...opts,
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

            return this.sendRequest(method, url, opts, tries);
        }
    }

    private async getPeer(useSeed: boolean = false): Promise<IPeer> {
        if (this.opts.peer) {
            return { ip: this.opts.peer, port: 4003 };
        }

        if (useSeed) {
            return sample(this.seeds);
        }

        const peer: IPeer = sample(await this.getPeers());
        const reachable: boolean = await isReachable(`${peer.ip}:${peer.port}`);

        if (!reachable) {
            logger.warn(`${peer.ip}:${peer.port} is unresponsive. Choosing new peer.`);

            return this.getPeer();
        }

        return peer;
    }

    private async getPeers(): Promise<IPeer[]> {
        const { data } = await this.sendRequest("get", "peers", {}, 0, true);

        if (!data || !data.length) {
            return this.seeds;
        }

        const peers: IPeer[] = [];

        for (const peer of data) {
            const pluginName: string = Object.keys(peer.ports).find((key: string) => key.split("/")[1] === "core-api");

            if (pluginName) {
                const port: number = peer.ports[pluginName];

                if (port >= 1 && port <= 65535) {
                    peers.push({ ip: peer.ip, port });
                }
            }
        }

        return peers;
    }

    private async loadSeeds(): Promise<void> {
        const { body } = await got.get(
            `https://raw.githubusercontent.com/ArkEcosystem/peers/master/${this.opts.network}.json`,
        );

        const seeds = JSON.parse(body);

        if (!seeds.length) {
            throw new Error("No seeds found");
        }

        for (const seed of seeds) {
            seed.port = 4003;
        }

        this.seeds = seeds;
    }
}

export const network = new Network();
