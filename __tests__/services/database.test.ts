import "jest-extended";

import { removeSync } from "fs-extra";
import { database } from "../../src/services/database";

it("should set and get a value", async () => {
    removeSync(`${__dirname}/exchange-json-rpc.sqlite`);

    await database.connect(`${__dirname}/exchange-json-rpc.sqlite`);

    expect(await database.get("key1")).toBeUndefined();

    await database.set("key1", "value");

    expect(await database.get("key1")).toBe("value");

    expect(await database.get("key2")).toBeUndefined();

    await database.set("key2", { hello: "world" });

    expect(await database.get("key2")).toEqual({ hello: "world" });
});
