const { guildId = '', botChannelId} = require('./config.json')
const { msgLogger } = require('./helper');
const { startAutoReminder } = require('./hourly');

function boot(client) {
	channel = client.channels.cache.get(botChannelId);

	const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
  startAutoReminder(client);
  (async () => {
    try {
    	msgLogger("auto start!!")

      await delay(1000);
      await channel.send(".hourly");

      await delay(1000);
      await channel.send(".stam");

      await delay(1000);
      await channel.send(".lotto");
    } catch (err) {
      console.error("❌ 發送指令失敗:", err);
    }
  })();

}

module.exports = { boot };