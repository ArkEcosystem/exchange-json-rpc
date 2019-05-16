import Keyv from "keyv";

class Database {
    private database: Keyv;

    public init(path: string) {
        this.database = new Keyv({
            uri: `sqlite://${path}/exchange-json-rpc.sqlite`,
        });
    }

    public async get<T = any>(id: string): Promise<T> {
        return this.database.get(id);
    }

    public async set<T = any>(id: string, value: T): Promise<void> {
        await this.database.set(id, value);
    }
}

export const database = new Database();
