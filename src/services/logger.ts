import pino from "pino";

export const logger = pino({
    name: "ark-rpc",
    safe: true,
    prettyPrint: true,
});
