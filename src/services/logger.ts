import pino from "pino";

export const logger = pino({
    name: "exchange-json-rpc",
    safe: true,
    prettyPrint: true,
});
