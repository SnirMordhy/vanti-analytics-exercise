import * as cron from 'node-cron';
import * as redis from 'redis';
import *  as util from 'util';

enum StateType {
    NORMAL= 'normal',
    MISSING = 'missing'
}
console.log('Start monitoring feed state');

const alertPeriod = Number.parseInt(process.env.ALERT_PERIOD_SECONDS || '60');
const client = redis.createClient();
const clientGet = util.promisify(client.get).bind(client);

client.set('state', StateType.NORMAL);

const getSecondsFromTimestamp = async () => {
    let timestamp = await clientGet('timestamp');
    let dateTimestamp = Date.parse(timestamp ? timestamp : '');
    return (Date.now() -  dateTimestamp) / 1000;
}

cron.schedule('* * * * *', async () => {
    const datesDifferenceSeconds = await getSecondsFromTimestamp();

    if(isNaN(datesDifferenceSeconds) || datesDifferenceSeconds > alertPeriod) {
        client.set('state', StateType.MISSING);
        console.warn(`No feed message has been received for more then ${alertPeriod} seconds`,);
    }
});

cron.schedule('*/5 * * * * *', async () => {
   const state = await clientGet('state');

   if(state === StateType.MISSING) {
       const datesDifferenceSeconds = await getSecondsFromTimestamp();
       if(datesDifferenceSeconds < alertPeriod) {
           client.set('state', StateType.NORMAL);
           console.log('Back to normal');
       }
   }
});