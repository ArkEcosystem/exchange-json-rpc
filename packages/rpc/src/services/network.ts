import { Managers, Types } from "@arkecosystem/crypto";
import { PeerDiscovery } from '@arkecosystem/peers'
import got from "got";
import isReachable from "is-reachable";
import sample from "lodash.sample";
import { IPeer } from "../interfaces";
import { logger } from "./logger";

class Network {
    private options: { network: Types.NetworkName; peer: string; maxLatency: number, peerPort: number };
    private peerDiscovery: any = null;

    public async init(options: { network: Types.NetworkName; peer: string; maxLatency: number, peerPort: number }): Promise<void> {
        this.options = options;

        const networkOrHost: string = this.options.peer
                ? `http://${this.options.peer}:${this.options.peerPort}/api/peers`
                : this.options.network;

        this.peerDiscovery = (await PeerDiscovery.new({ networkOrHost })).withLatency(options.maxLatency);

        Managers.configManager.setFromPreset(options.network);
    }

    public async sendGET({ path, query = {} }: { path: string; query?: Record<string, any> }) {
        return this.sendRequest("get", path, { query });
    }

    public async sendPOST({ path, body = {} }: { path: string; body: Record<string, any> }) {
        return this.sendRequest("post", path, { body });
    }

    private async sendRequest(method: string, url: string, options, tries: number = 0) {
        try {
            const peer: IPeer = await this.getPeer();
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

    private async getPeer(): Promise<IPeer> {
        if (this.options.peer) {
            return { ip: this.options.peer, port: this.options.peerPort };
        }

        const peer: IPeer = sample(await this.getPeers());
        const reachable: boolean = await isReachable(`${peer.ip}:${peer.port}`);

        if (!reachable) {
            logger.warn(`${peer.ip}:${peer.port} is unresponsive. Choosing new peer.`);

            return this.getPeer();
        }

        return { ip: peer.ip, port: peer.port };
    }

    private async getPeers(): Promise<IPeer[]> {
        const peers: IPeer[] = this.peerDiscovery
            .findPeersWithPlugin("core-api");

        return peers;
    }
}

export const network = new Network();
