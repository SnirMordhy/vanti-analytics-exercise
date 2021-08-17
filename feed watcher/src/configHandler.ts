import * as fs from "fs";

export const getConfigJSON = (path: string) => {
    const config = fs.readFileSync(path);
    return JSON.parse(config.toString('utf8'));
}