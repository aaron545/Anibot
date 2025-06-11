const { kickList } = require('./config.json');

function messageExtractor(message) {
  let embedTitle = message.embeds[0]?.title ?? 'empty_title';
  let embedDesc = message.embeds[0]?.description ?? 'empty_description';
  let embedAuthor = message.embeds[0]?.author?.name ?? 'empty_author';
  let embedFooter = message.embeds[0]?.footer?.text ??'empty_footer'

  return [embedTitle, embedDesc, embedAuthor, embedFooter]
}

function msgLogger(msg) {
  const now = new Date();
  const formattedTime = now.toLocaleString("zh-TW", { timeZone: "Asia/Taipei" }); // 轉成 "YYYY-MM-DD HH:MM:SS"
  // console.log("----------");
  console.log(`[${formattedTime}] --normal-- ${msg}`);
  // console.log("----------");
}
function msgDebugger(msg) {
  const now = new Date();
  const formattedTime = now.toLocaleString("zh-TW", { timeZone: "Asia/Taipei" }); // 轉成 "YYYY-MM-DD HH:MM:SS"
  console.log(`[${formattedTime}] --Debug-- ${msg}`);
}

function extractStamina(content, username) {
  // Escape username 內可能影響 regex 的特殊符號
  const escapedUsername = username.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
  const staminaRegex = new RegExp(`\\*\\*${escapedUsername}\\*\\*, you currently have __(\\d+)/(\\d+)__ stamina\\.`);

  const match = content.match(staminaRegex);
  if (match) {
    const current = parseInt(match[1], 10);
    const max = parseInt(match[2], 10);
    return { current, max };
  }
  return null; // 沒抓到就回傳 null
}

function extractRaidParticipants(msg) {
  // 擷取 Raid Leader
  const leaderMatch = msg.match(/__Raid Leader:__\n\*\*#\d+ \| ([^\s]+) \(\d+\)/);
  const leader = leaderMatch ? leaderMatch[1] : null;

  // 擷取所有成員（包含 Leader，但後續會過濾）
  const allMatches = [...msg.matchAll(/\*\*#\d+ \| ([^\s]+) \(\d+\) \| Level \d+ \| Power Level: [\d,]+\*\*/g)];
  const allNames = allMatches.map(m => m[1]);

  // 過濾掉 Leader 自己
  const members = allNames.filter(name => name !== leader);

  return { leader, members };
}

function getCardRarity(text) {
  const rarityMap = {
    common: 'C',
    not: 'U',
    rare: 'R',
    super: 'S',
    ultra: 'U',
  };

  const emojis = [...text.matchAll(/<:([^:]+):\d+>/g)].map(m => m[1]);
  let rarity = '';
  for (const e of emojis) {
    if (rarityMap[e]) {
      rarity += rarityMap[e];
    }
  }
  return rarity || null;
}

function getWildCardName(text) {
  const match = text.match(/<:[^:]+:\d+>\*\*(.+?)\*\*/);
  return match ? match[1].trim() : null;
}

function parseRewards(description) {
  const elementEmojiMap = {
    Null: '🚫',
    Neutral: '✨',
    Dark: '🌙',
    Light: '☀️',
    Grass: '🍃',
    Water: '💧',
    Fire: '🔥',
    Ground: '⛰️',
    Electric: '⚡',
  };

  const lines = [...description.matchAll(/(?:\*\*•|\• \*\*)(.+?)\*\*/g)].map(m => m[1].trim());

  const rewards = lines.map(line => {
    if (line.includes('No Rewards Given')) {
      return 'No Rewards Given 💩 , ban 211 !!!';
    }

    // const emojis = [...line.matchAll(/<:([^:]+):\d+>/g)].map(m => m[1]);
    const cleanedText = line.replace(/<[^>]+>/g, '').trim();

    const rarity = getCardRarity(line); // 使用抽離的函式
    const isCard = rarity !== null;
    let suffixEmoji = '';

    if (isCard) {
      const emoji = /SR|UR/.test(rarity) ? '🎴' : '🖼️';
      return `${rarity.trim()} ${cleanedText} ${emoji}`;
    }

    const matchedElement = Object.keys(elementEmojiMap).find(el => cleanedText.includes(el));
    if (matchedElement) {
      suffixEmoji = ` ${elementEmojiMap[matchedElement]}`;
    } else if (/Stamina/i.test(cleanedText)) {
      suffixEmoji = ' 🪽';
    } else if (/Pass/i.test(cleanedText)) {
      suffixEmoji = ' 🎫';
    } else if (/Exp/i.test(cleanedText)) {
      suffixEmoji = ' 📕';
    } else if (/Gold/i.test(cleanedText)) {
      suffixEmoji = ' 🪙';
    } else if (/Diamond/i.test(cleanedText)) {
      suffixEmoji = ' 💎';
    } else if (/Fragment/i.test(cleanedText)) {
      suffixEmoji = ' 🧩';
    }

    return `${cleanedText}${suffixEmoji}`;
  });

  return rewards;
}

function getKickedMembers(members) {
  return members
    .map((name, index) => ({ name, index: index + 2 }))  // 加 2，代表實際位置
    .filter(member => kickList.includes(member.name));
}

function parseRaidLobbies(description) {
  const pattern = /\*\*#\d+ \| (.+?) \[(.+?)\]\*\*.*?\n(.+?) \| Level (\d+) \| ID: (\d+)/g;

  const raids = [...description.matchAll(pattern)].map(match => ({
    name: match[1],
    time: match[2],
    rarity: match[3],
    level: parseInt(match[4]),
    id: match[5],
  }));

  return raids;
}

module.exports = { 
  messageExtractor,
  msgLogger,
  msgDebugger,
  extractStamina,
  extractRaidParticipants,
  getCardRarity,
  getWildCardName,
  parseRewards,
  getKickedMembers,
  parseRaidLobbies,
};