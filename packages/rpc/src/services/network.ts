import { Managers, Types } from "@arkecosystem/crypto";
import got from "got";
import isReachable from "is-reachable";
import sample from "lodash.sample";
import { IPeer } from "../interfaces";
import { logger } from "./logger";

class Network {
    private options: { network: Types.NetworkName; peer: string; peerPort: number };
    private seeds: IPeer[] = [];

    public async init(options: { network: Types.NetworkName; peer: string; peerPort: number }): Promise<void> {
        this.options = options;

        Managers.configManager.setFromPreset(options.network);

        await (options.peer ? this.loadSeedsFromPeer() : this.loadSeedsFromGithub());
    }

    public async sendGET({ path, query = {} }: { path: string; query?: Record<string, any> }) {
        return this.sendRequest("get", path, { query });
    }

    public async sendPOST({ path, body = {} }: { path: string; body: Record<string, any> }) {
        return this.sendRequest("post", path, { body });
    }

    private async sendRequest(method: string, url: string, options, tries: number = 0, useSeed: boolean = false) {
        try {
            const peer: IPeer = await this.getPeer(useSeed);
            const uri: string = `http://${peer.ip}:${peer.port}/api/${url}`;

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

    private async getPeer(useSeed: boolean = false): Promise<IPeer> {
        if (this.options.peer) {
            return { ip: this.options.peer, port: this.options.peerPort };
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

    private async loadSeedsFromGithub(): Promise<void> {
        const { body } = await got.get(
            `https://raw.githubusercontent.com/ArkEcosystem/peers/master/${this.options.network}.json`,
        );

        this.setSeeds(JSON.parse(body));
    }

    private async loadSeedsFromPeer(): Promise<void> {
        const { body } = await got.get(`http://${this.options.peer}/api/peers`);

        this.setSeeds(JSON.parse(body).data);
    }

    private setSeeds(seeds: IPeer[]): void {
        if (!seeds.length) {
            throw new Error("No seeds found");
        }

        for (const seed of seeds) {
            seed.port = this.options.peerPort;
        }

        this.seeds = seeds;
    }
}

export const network = new Network();
