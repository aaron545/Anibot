const { guildId = '', botChannelId, ownChannelId, anigameDMChannelId, lottox, lottoy } = require('./config.json');
const { messageExtractor, msgLogger , msgDebugger , extractStamina , extractRaidParticipants, parseRewards } = require('./helper');

let lastHourlyTime = Date.now();
let lastLottoTime = Date.now();

const HOURLY_INTERVAL = 65 * 60 * 1000; // 65 分鐘
const LOTTO_INTERVAL = 17 * 60 * 1000;  // 17 分鐘

let raidAutoStart = false;
let raidReady = false


function startAutoReminder(client) {
  const channel = client.channels.cache.get(botChannelId);
  const ownChannel = client.channels.cache.get(ownChannelId);
  if (!channel) return;

  setInterval(() => {
    const now = Date.now();

    // msgDebugger(`lastHourlyTime = (${new Date(lastHourlyTime).toLocaleString()})`);
    // msgDebugger(`lastLottoTime = (${new Date(lastLottoTime).toLocaleString()})`);

    if (now - lastHourlyTime >= HOURLY_INTERVAL) {
      msgLogger("Didn't receive hourly reminder for more than 65 minutes, automatically sent .hourly");
      channel.send(".hourly").catch(console.error);
      lastHourlyTime = now; // 重置時間
    }

    if (now - lastLottoTime >= LOTTO_INTERVAL) {
      msgLogger("Didn't receive lotto reminder for more than 17 minutes, automatically sent .lotto");
      channel.send(".lotto").catch(console.error);
      lastLottoTime = now; // 重置時間
    }

    if (raidAutoStart){
      ownChannel.send(".rd lobby").catch(console.error);
    }
  }, 60 * 1000); // 每分鐘檢查一次
}

async function checkRaidParty(message, client){
  if (guildId === '') return;
  if (message.guildId != guildId) return;

  const channel = client.channels.cache.get(botChannelId);
  const ownChannel = client.channels.cache.get(ownChannelId);

  let [title, desc, embedAuthor, footer] = messageExtractor(message);

  if (desc.includes("you have successfully set your Raid Room to Public!") && desc.includes(client.user.username)){
    msgLogger("public!! will auto start with 5 members");
    raidAutoStart = true;
  }

  if (desc.includes("you have successfully set your Raid Room to Private!") && desc.includes(client.user.username)){
    msgLogger("private!! auto start will be closed");
    raidAutoStart = false;
  }

  if (message.content.includes(".rd leave") && message.author.username === client.user.username){
    msgLogger("leave the raid!! auto start will be closed");
    raidAutoStart = false;
  }

  if (desc.includes("you are not currently in a raid!") && desc.includes(client.user.username)){
    msgLogger("raid disappear!! auto start will be closed");
    raidAutoStart = false;
    raidReady = false;
  }

  if (message.author.username === 'AniGame' && title.includes("Raid Challenge Party")){
    const result = extractRaidParticipants(desc);
    if (!result) return;

    const { leader, members } = result;
    const isInRaid = leader === client.user.username || members.includes(client.user.username);

    if (!isInRaid) return;

    if (leader != client.user.username && !members.includes(client.user.username)) return; 

    msgDebugger(`raidAutoStart : ${raidAutoStart}`)
    if (raidAutoStart) {
      msgLogger(`leader: ${leader}, members: ${members}, members.length: ${members.length}`);
      if (leader != client.user.username) return;

      msgDebugger("I'm leader!!! hohoho~~")
      if (members.length >= 4){
        msgDebugger("人來啦!!")
        const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
        await delay(1000);
        ownChannel.send(".rd start");
        msgLogger("ready to start raid!!!")

        // await delay(2000);
        // channel.send(".rd bt all");
        // msgLogger("start raid!!!")
        // raidAutoStart = false;
      } else {
        msgDebugger("人數不足!!")
      }
    } else {
      msgLogger(`leader: ${leader}, members: ${members}, members.length: ${members.length}`);
    }
  }
}

async function checkRaidReady(message, client){
  if (message.channelId != ownChannelId && message.channelId != anigameDMChannelId) return;

  const channel = client.channels.cache.get(botChannelId);
  let [title, desc, embedAuthor, footer] = messageExtractor(message);

  if (embedAuthor === client.user.username && footer.includes("you have successfully notified the leader that you are ready!")){
    msgLogger("ready!! and wait for leader start raid!!")
    raidReady = true;
  }

  if (message.channelId === anigameDMChannelId && message.content.includes("the Raid Challenge has started!") && (raidReady||raidAutoStart)){
    msgLogger("Leader start the raid, auto start!!")
    channel.send(".rd bt all");
    raidAutoStart = false;
    raidReady = false;
  }
}

async function tryClickButton(message, retries = 3, delayMs = 1000) {
  for (let i = 0; i < retries; i++) {
    try {
      await message.clickButton({ X: 0, Y: 0 });
      msgLogger(`✅ Do rd success on try #${i + 1}`);
      return true;
    } catch (err) {
      msgLogger(`⚠️ Do rd failed on try #${i + 1}`);
      msgLogger(err);
      if (i < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, delayMs)); // 等待一下再重試
      }
    }
  }
  msgLogger('❌ All retries for rd failed');
  return false;
}

async function checkHourly(message, client) {
  if (guildId === '') return;
  if (message.guildId != guildId) return;
  if (message.channelId != botChannelId) return;

  const user_at = `<@${client.user.id}>`;
  const username = client.user.username.replace(/_/g, "");

  let [title, desc, embedAuthor, footer] = messageExtractor(message);
  channel = client.channels.cache.get(message.channelId);

  // if (message.author.username === 'AniGame' && message.embeds[0]?.footer){
  //   console.log(embedAuthor)
  //   console.log(embedAuthor.includes(username))
  //   console.log(message.embeds[0].footer)
  //   console.log(message.embeds[0].footer.text)
  //   console.log(footer)
  // }

  // check hourly 

  if (message.content.includes('test211')){
    msgDebugger('Bot is still alive!!!')
  }

  if (message.content.includes('Hourly Reminder') && message.content.includes(user_at)) {
    lastHourlyTime = Date.now(); // ➤ 更新時間
    msgLogger('Try to do hourly!!!');

    // 定義一個函式來延遲執行
    const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    (async () => {
      try {
        // 等待 1 秒後發送 `.hourly`
        await delay(1000);
        await channel.send(".hourly");
        msgLogger('Do hourly success');

        await delay(1000);
        await channel.send(".stam");
        msgLogger('Check stamina');

      } catch (err) {
        console.error("❌ 發送指令失敗:", err);
      }
    })();
  }

  // const hourlyRegex = /Congrats! You have received __(\d+)__ stamina for your hourly bonus\./;
  // const match = message.content.match(hourlyRegex);
  // if (match){
  //   const stamina = match[1];
  //   console.log('Do hourly success')
  //   console.log(`You received ${stamina} stamina`);
  //   console.log('Try to do bt all!!!')
  //   channel.send(".bt all");
  // }

  if (embedAuthor.replace(/_/g, "").includes(username) && footer.includes('EXP')){
    msgLogger('Do bt all success')
  }

  // check lotto 
  if (message.content.includes('Lotto Reminder') && message.content.includes(user_at)){
    lastLottoTime = Date.now(); // ➤ 更新時間
    msgLogger('Try to do lotto!!!')

    setTimeout(() => {
      channel.send(".lotto")
        .catch((err) => console.error("❌ 發送 `.lotto` 失敗:", err));
    }, 1000); // 延遲 1 秒（1000 毫秒）
  }

  if (title.includes('Scratch Ticket') && embedAuthor.replace(/_/g, "").includes(username)){
    msgLogger('Try to choose lotto!!!')
    setTimeout(() => {
      message.clickButton({ X: lottox, Y: lottoy })
        .then(() => {
          msgLogger('Choose lotto success!')
        })
        .catch(err => {
          msgLogger('Choose lotto failed QAQ')
          msgLogger(err)
        })
    }, 1000); // 延遲 1 秒（1000 毫秒）
  }

  // check raid energy
  if (message.content.includes('Energy Reminder') && message.content.includes(user_at)){
    channel.send(".rd bt all");
  }

  if (title.includes('Raid Boss Battle') && embedAuthor.replace(/_/g, "").includes(username) && footer.includes('React with ✅ to confirm the battle!')){
    msgLogger('Try to do rd!!!')
    tryClickButton(message);
  }

  if (message.content.includes(client.user.username) && message.author.username === 'AniGame'){

    const result = extractStamina(message.content, client.user.username);
    if (result) {
      const { current, max } = result;
      msgLogger(`stam: (current, max) = (${current}, ${max})`);
      if (current >= max-60){
        msgLogger("Do bt all!!!")
        channel.send(".bt all")
      }
    } 
  }

  if (message.content.includes('Stamina Reminder') && message.content.includes(user_at)){
    channel.send(".bt all");
  }

}

async function getRewards(message, client) {
  if (message.channelId != botChannelId && message.channelId != anigameDMChannelId) return;

  let [title, desc, embedAuthor, footer] = messageExtractor(message);
  channel = client.channels.cache.get(message.channelId);
  const username = client.user.username.replace(/_/g, "");

  if (title.includes('Scratch Ticket') && embedAuthor.replace(/_/g, "").includes(username)){
    msgLogger(`The lotto rewards: ${parseRewards(desc)}`);
  }

  // if (title.includes('Raid Boss Defeated') && embedAuthor.replace(/_/g, "").includes(username)){
  //   msgLogger(`The raid rewards: ${parseRewards(desc)}`);
  // }
}

module.exports = { startAutoReminder, checkRaidParty, checkRaidReady, checkHourly, getRewards };