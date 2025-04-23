const { Client } = require('discord.js-selfbot-v13');
const { token } = require('./config.json');
const { messageExtractor, msgLogger , msgDebugger , extractRaidParticipants, parseRewards } = require('./helper');
const { guildId = '', botChannelId , ownChannelId, anigameDMChannelId } = require('./config.json');

let raidAutoStart = false;
let raidReady = false;

const client = new Client();
let channel;
let ownChannel;

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
  console.log(client.user.username);
  channel = client.channels.cache.get(botChannelId);
  ownChannel = client.channels.cache.get(ownChannelId);
})

client.on('messageCreate', async (message) => {
  if (message.channelId != anigameDMChannelId) return;

  const user_at = `<@${client.user.id}>`;
  const username = client.user.username.replace(/_/g, "");

  let [title, desc, embedAuthor, footer] = messageExtractor(message);
  channel = client.channels.cache.get(message.channelId);
  console.log(message)

  if (title.includes('Raid Boss Defeated')){
    console.log(message);
    msgLogger(`The raid rewards: ${parseRewards(desc)}`);
  }

});

client.on('messageUpdate', async (oldMessage, message) => {
  if (message.channelId != anigameDMChannelId) return;

  const user_at = `<@${client.user.id}>`;
  const username = client.user.username.replace(/_/g, "");

  let [title, desc, embedAuthor, footer] = messageExtractor(message);
  channel = client.channels.cache.get(message.channelId);

  // if (title.includes('Scratch Ticket') && embedAuthor.replace(/_/g, "").includes(username)){
  //   // msgLogger(message);
  //   console.log(message);
  //   msgLogger(`The lotto rewards: ${parseRewards(desc)}`);
  // }

});

client.login(token).catch(reason => { console.log(reason); process.exit(0); });