const { guildId = '', botChannelId, ownChannelId, anigameDMChannelId, wishList, lottox, lottoy } = require('./config.json');
const helper = require('./helper');
let lastHourlyTime = Date.now();
let lastLottoTime = Date.now();

const HOURLY_INTERVAL = 65 * 60 * 1000; // 65 分鐘
const LOTTO_INTERVAL = 17 * 60 * 1000;  // 17 分鐘

let raidAutoStart = false;
let raidReady = false;
let raidAutoFind = false;

let postfix;

let spamtext = [
  "別墅裡面唱K",
  "水池裡面銀龍魚",
  "我送阿叔茶具",
  "他研磨下筆",
  "直接送我四個字",
  "大展鴻圖",
  "大師親手提筆字",
  "大展鴻圖",
  "搬來放在辦公室",
  "大展鴻圖",
  "關公都點頭 有料",
  "---------------"]
let index = 0;

function safeSend(channel, content) {
  return channel.send(content).catch(err => {
    helper.msgLogger(`❌ Failed to send "${content}" to channel ${channel.id}:`);
    helper.msgLogger(err);
  });
}

function startAutoReminder(client) {
  const channel = client.channels.cache.get(botChannelId);
  const ownChannel = client.channels.cache.get(ownChannelId);

  const evSpawnChannel = client.channels.cache.get("1238169876997079192");

  if (!channel) return;

  setInterval(() => {
    const now = Date.now();

    // helper.msgDebugger(`lastHourlyTime = (${new Date(lastHourlyTime).toLocaleString()})`);
    // helper.msgDebugger(`lastLottoTime = (${new Date(lastLottoTime).toLocaleString()})`);

    if (now - lastHourlyTime >= HOURLY_INTERVAL) {
      helper.msgLogger("Didn't receive hourly reminder for more than 65 minutes, automatically sent .hourly");
      safeSend(channel, ".hourly");
      lastHourlyTime = now; // 重置時間
    }

    if (now - lastLottoTime >= LOTTO_INTERVAL) {
      helper.msgLogger("Didn't receive lotto reminder for more than 17 minutes, automatically sent .lotto");
      safeSend(channel, ".lotto");
      lastLottoTime = now; // 重置時間
    }

    if (raidAutoStart){
      safeSend(ownChannel, ".rd lobby");
    }

  }, 60 * 1000); // 每分鐘檢查一次

  setInterval(() => {
    if (raidAutoFind){
      if (!postfix) {
        ownChannel.send(`.rd lobbies -n ${wishList.join(',')} -r r,sr,ur -d m,h,i`).catch(console.error);
      }
      else {
        ownChannel.send(postfix).catch(console.error);
      }
    }

    safeSend(evSpawnChannel, spamtext[index]);
    index = (index + 1) % spamtext.length;

  }, 16 * 1000); // 每16秒
}

async function checkRaidParty(message, client){
  if (guildId === '') return;
  if (message.guildId != guildId) return;

  const channel = client.channels.cache.get(botChannelId);
  const ownChannel = client.channels.cache.get(ownChannelId);

  let [title, desc, embedAuthor, footer] = helper.messageExtractor(message);

  if (desc.includes("you have successfully set your Raid Room to Public!") && desc.includes(client.user.username)){
    helper.msgLogger("public!! will auto start with 5 members");
    raidAutoStart = true;
  }

  if (desc.includes("you have successfully set your Raid Room to Private!") && desc.includes(client.user.username)){
    helper.msgLogger("private!! auto start will be closed");
    raidAutoStart = false;
  }

  if (message.content.includes(".rd leave") && message.author.username === client.user.username){
    helper.msgLogger("leave the raid!! auto start will be closed");
    raidAutoStart = false;
    raidReady = false;
  }

  if (desc.includes("you are not currently in a raid!") && desc.includes(client.user.username)){
    helper.msgLogger("raid disappear!! auto start will be closed");
    raidAutoStart = false;
    raidReady = false;
  }

  if (message.content.toLowerCase().startsWith("start find") && message.author.username === client.user.username) {
    postfix = message.content.replace(/^start find\s*/i, "");
    // console.log(`postfix = "${postfix}"`)
    helper.msgLogger("start auto find!!");
    raidAutoFind = true;
  }

  if (message.content.toLowerCase() === 'stop find' && message.author.username === client.user.username) {
    postfix = ''
    helper.msgLogger("stop auto find!!");
    raidAutoFind = false;
  }

  if (desc.includes("are you sure you would like to kick")){
    message.clickButton({ X: 0, Y: 0 });
  }

  if (message.author.username === 'AniGame' && title.includes("Raid Challenge Party")){
    const result = helper.extractRaidParticipants(desc);
    if (!result) return;

    const { leader, members } = result;
    const isInRaid = leader === client.user.username || members.includes(client.user.username);

    if (!isInRaid) return;

    if (leader != client.user.username && !members.includes(client.user.username)) return; 

    helper.msgDebugger(`raidAutoStart : ${raidAutoStart}`)
    if (raidAutoStart) {
      helper.msgLogger(`leader: ${leader}, members: ${members}, members.length: ${members.length}`);
      if (leader != client.user.username) return;
      helper.msgDebugger("I'm leader!!! hohoho~~")

      // add kick code here 

      const kickedMembers = helper.getKickedMembers(members);
      const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

      if (kickedMembers.length > 0) {
        const sortedMembers = kickedMembers.sort((a, b) => b.index - a.index); // 降冪排序
        for (const member of sortedMembers) {
          helper.msgLogger(`⚠️ 發現黑名單玩家：${member.name}，位置 index：${member.index}`);
          safeSend(ownChannel, `.rd kick ${member.index}`);
          await delay(1000); // 每人間隔 0.5 秒
        return;
        }
      }


      if (members.length >= 4){
        helper.msgDebugger("人來啦!!")
        await delay(1000);
        safeSend(ownChannel, ".rd start");
        helper.msgLogger("ready to start raid!!!")

        // await delay(2000);
        // channel.send(".rd bt all");
        // helper.msgLogger("start raid!!!")
        // raidAutoStart = false;
      } else {
        helper.msgDebugger("人數不足!!")
      }
    } else {
      helper.msgLogger(`leader: ${leader}, members: ${members}, members.length: ${members.length}`);
    }
  }
}

async function checkRaidReady(message, client){
  if (message.channelId != ownChannelId && message.channelId != anigameDMChannelId) return;

  const channel = client.channels.cache.get(botChannelId);
  let [title, desc, embedAuthor, footer] = helper.messageExtractor(message);

  if (embedAuthor === client.user.username && footer.includes("you have successfully notified the leader that you are ready!")){
    helper.msgLogger("ready!! and wait for leader start raid!!")
    raidReady = true;
  }

  if (message.channelId === anigameDMChannelId && message.content.includes("the Raid Challenge has started!") && (raidReady||raidAutoStart)){
    helper.msgLogger("Leader start the raid, auto start!!")
    channel.send(".rd bt all");
    raidAutoStart = false;
    raidReady = false;
  }
}

// async function checkAutoFind(message,client){
//   if (message.channelId != ownChannelId) return;
//   const ownChannel = client.channels.cache.get(ownChannelId);
//   let [title, desc, embedAuthor, footer] = helper.messageExtractor(message);

//   if (title.includes('Raid Lobbies')) {
//     const raids = helper.parseRaidLobbies(desc)

//     for (const raid of raids) {
//       if (wishList.includes(raid.name)) {
//         ownChannel.send(`.rd join ${raid.id}`)
//         // 在這加入判斷是否加入成功
//         helper.msgLogger('success to find!!')
//         raidAutoFind = false;
//         break;
//       }
//     }
//   }
// }

async function checkAutoFind(message, client) {
  if (message.channelId !== ownChannelId) return;
  const ownChannel = client.channels.cache.get(ownChannelId);
  let [title, desc, embedAuthor, footer] = helper.messageExtractor(message);

  if (title.includes('Raid Lobbies')) {
    raids = helper.parseRaidLobbies(desc);

    for (const raid of raids) {
      if (raidAutoFind && embedAuthor.includes(client.user.username)) {
        const sentMsg = await safeSend(ownChannel, `.rd join ${raid.id}`);
        helper.msgLogger(`try to join ${raid.name} raid（ID: ${raid.id}）`);

        const result = await waitForJoinResult(ownChannel);
        if (result === 'success') {
          helper.msgLogger('Success to join raid, stop auto find');
          raidAutoFind = false;
          break;
        } else {
          helper.msgLogger('Failed to join raid, auto find continuously');
          continue;
        }
      }
    }
  }
}

// 加入後等待 AniGame 的回應
async function waitForJoinResult(channel) {
  try {
    const response = await channel.awaitMessages({
      filter: m =>
        m.author.username === 'AniGame' &&
        m.author.bot &&
        m.embeds.length > 0 &&
        m.embeds[0].description,
      max: 1,
      time: 5000, // 最多等 5 秒
      errors: ['time']
    });

    const reply = response.first();
    const desc = reply.embeds[0].description;

    if (desc.includes('there was an error joining the lobby')) {
      return 'fail';
    }

    return 'success';
  } catch (e) {
    // 超時沒收到訊息
    return 'fail';
  }
}


async function tryClickButton(message, retries = 5, delayMs = 1000, pos = {X: 0, Y: 0}) {
  for (let i = 0; i < retries; i++) {
    try {
      await message.clickButton(pos);
      helper.msgLogger(`✅ Do button click success on try #${i + 1}`);
      return true;
    } catch (err) {
      helper.msgLogger(`⚠️ Do button click failed on try #${i + 1}`);
      helper.msgLogger(err);

      // 若錯誤為 Unknown Message，可立即跳出重試
      if (err.code === 10008) {
        helper.msgLogger("⛔ Message 已不存在，停止重試");
        return false;
      }
      if (i < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, delayMs)); // 等待一下再重試
      }
    }
  }
  helper.msgLogger('❌ All retries for button click failed');
  return false;
}

async function checkHourly(message, client) {
  if (guildId === '') return;
  if (message.guildId != guildId) return;
  if (message.channelId != botChannelId) return;

  const user_at = `<@${client.user.id}>`;
  const username = client.user.username.replace(/_/g, "");

  let [title, desc, embedAuthor, footer] = helper.messageExtractor(message);
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
    helper.msgDebugger('Bot is still alive!!!')
  }

  if (message.content.includes('Hourly Reminder') && message.content.includes(user_at)) {
    helper.msgLogger('Got Hourly Reminder!!')
    lastHourlyTime = Date.now(); // ➤ 更新時間

    // 定義一個函式來延遲執行
    const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    (async () => {
      try {
        // 等待 1 秒後發送 `.hourly`
        await delay(1000);
        await safeSend(channel, ".hourly");
        helper.msgLogger('Do hourly success');

        await delay(1000);
        await safeSend(channel, ".stam");
        helper.msgLogger('Check stamina');

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
    helper.msgLogger('Do bt all success')
  }

  // check lotto 
  if (message.content.includes('Lotto Reminder') && message.content.includes(user_at)){
    helper.msgLogger('Got Lotto Reminder!!')
    lastLottoTime = Date.now(); // ➤ 更新時間

    setTimeout(() => {
      safeSend(channel, ".lotto");
    }, 1000); // 延遲 1 秒（1000 毫秒）
  }

  if (title.includes('Scratch Ticket') && embedAuthor.replace(/_/g, "").includes(username)){
    helper.msgLogger('Try to choose lotto!!!')
    setTimeout(() => {
      tryClickButton(message, 3, 1000, {X: lottox, Y: lottoy})
        .then(() => {
          helper.msgLogger('Choose lotto success!')
        })
        .catch(err => {
          helper.msgLogger('Choose lotto failed QAQ')
          helper.msgLogger(err)
        })
    }, 1000); // 延遲 1 秒（1000 毫秒）
  }

  // check raid energy
  if (message.content.includes('Energy Reminder') && message.content.includes(user_at)){
    helper.msgLogger('Got Energy Reminder!!')
    safeSend(channel, ".rd bt all");
  }

  if (title.includes('Raid Boss Battle') && embedAuthor.replace(/_/g, "").includes(username) && footer.includes('React with ✅ to confirm the battle!')){
    helper.msgLogger('Try to do rd!!!')
    tryClickButton(message);
  }

  if (message.content.includes(client.user.username) && message.author.username === 'AniGame'){

    const result = helper.extractStamina(message.content, client.user.username);
    if (result) {
      const { current, max } = result;
      helper.msgLogger(`stam: (current, max) = (${current}, ${max})`);
      if (current >= max-60){
        helper.msgLogger("Do bt all!!!")
        safeSend(channel, ".bt all");
      }
    } 
  }

  if (message.content.includes('Stamina Reminder') && message.content.includes(user_at)){
    helper.msgLogger('Got Stamina Reminder!!')
    safeSend(channel, ".bt all");
  }

}

async function getRewards(message, client) {
  if (message.channelId != botChannelId && message.channelId != anigameDMChannelId) return;

  let [title, desc, embedAuthor, footer] = helper.messageExtractor(message);
  channel = client.channels.cache.get(message.channelId);
  const username = client.user.username.replace(/_/g, "");

  if (title.includes('Scratch Ticket') && embedAuthor.replace(/_/g, "").includes(username)){
    helper.msgLogger(`The lotto rewards: ${helper.parseRewards(desc)}`);
  }

  // if (title.includes('Raid Boss Defeated') && embedAuthor.replace(/_/g, "").includes(username)){
  //   helper.msgLogger(`The raid rewards: ${helper.parseRewards(desc)}`);
  // }
}

async function autoFindRaid(message, client) {
  if (message.channelId != ownChannelId) return;

  const ownChannel = client.channels.cache.get(ownChannelId);
  let [title, desc, embedAuthor, footer] = helper.messageExtractor(message);

  if (message.content === 'start find'){
    raidAutoFind = true;
  }

  if (message.content === 'stop find'){
    raidAutoFind = false;
  }
}


module.exports = { startAutoReminder, checkRaidParty, checkRaidReady, checkAutoFind,  checkHourly, getRewards };