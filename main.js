const { Client } = require('discord.js-selfbot-v13');
const { token } = require('./config.json');
const { checkRaidParty , checkRaidReady , checkHourly, getRewards } = require('./hourly');
const { checkFestivalGift } = require('./festival gift');

const { boot } = require('./boot');

const client = new Client();
client.on('ready', async () => {
  let welcomeMsg = `

     ___          _                          
    /   |  ____  (_)___ _____ _____ ___  ___ 
   / /| | / __ \\/ / __ \`/ __ \`/ __ \`__ \\/ _ \\
  / ___ |/ / / / / /_/ / /_/ / / / / / /  __/
 /_/  |_/_/ /_/_/\\__, /\\__,_/_/ /_/ /_/\\___/ 
                /____/                       

 `
  console.log(welcomeMsg);
  console.log(`Login as ${client.user.username}`);
  boot(client);
})

client.on('messageCreate', async (message) => {
  checkHourly(message, client);
  checkRaidParty(message, client);
  checkRaidReady(message, client);
  checkFestivalGift(message);
})

client.on('messageUpdate', async (oldMessage, newMessage) => {
  getRewards(newMessage, client)
});


client.login(token).catch(reason => { console.log(reason); process.exit(0); });