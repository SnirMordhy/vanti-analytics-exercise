import * as chokidar from 'chokidar';
import * as path from 'path';
import {getConfigJSON} from "./configHandler";
import * as redis from 'redis';

console.log('Starting listener program');

const client = redis.createClient();
client
    .on("error", (err) => console.error(err))
    .on("ready", () => console.log('redis client successfully connected'));

const localFolder = process.env.CUSTOMERS_LOCAL_FOLDER || '.';
const watcher = chokidar.watch(localFolder, {ignoreInitial: true});

watcher
    .on('ready', (() => console.log('Start listening to customers file for changes')))
    .on('add', ((filePath, stats) => {
        const customersConfig = getConfigJSON('src\\resources\\customers.config.json');
        const ids: String[] = customersConfig.ids;

        const fileName = path.basename(filePath, '.batch');

        if(ids.includes(fileName)) {
            console.log(`customer file has been found: `, fileName);

            const timestamp = stats ? stats.ctime : new Date(Date.now());
            client.set('timestamp', timestamp.toISOString(), redis.print);
        }
    }));