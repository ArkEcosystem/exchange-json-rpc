import pino from "pino";

class Logger {
    private logger: any;

    public constructor() {
        this.logger = pino({
            name: "exchange-json-rpc",
            safe: true,
            prettyPrint: true,
        });
    }

    public setLogger(logger: any): void {
        this.logger = logger;
    }

    public error(message: any): void {
        this.logger.error(message);
    }

    public warn(message: any): void {
        this.logger.warn(message);
    }

    public info(message: any): void {
        this.logger.info(message);
    }

    public debug(message: any): void {
        this.logger.debug(message);
    }

    public verbose(message: any): void {
        this.logger.verbose(message);
    }
}

export const logger = new Logger();
