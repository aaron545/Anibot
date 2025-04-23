const { guildId = '', channelId} = require('./config.json');
const { messageExtractor, msgLogger , msgDebugger } = require('./helper');

async function checkFestivalGift(message) {
  if (guildId === '') return;
  if (message.guildId != guildId) return;
  if (message.channelId != '1235893917824581763') return;
  let [title, desc, embedAuthor, footer] = messageExtractor(message);

  // if (title.includes('Successfully claimed by')){
  //   message.delete()
  //     .then(() => {
  //       console.log('Delete collection message!')
  //     })
  // }

  // if (title.includes('Chest Spawned!')){
  //   message.delete()
  //     .then(() => {
  //       console.log('Delete Chest message!')
  //     })
  // }

  // if (desc.includes('A wild AniGame card appears!')) {
  //   await new Promise(resolve => setTimeout(resolve, 1000));
  //   message.delete()
  //     .then(() => {
  //       console.log('Wild card message deleted!');
  //     })
  //     .catch(err => {
  //       console.log('Get wild failed QAQ')
  //       console.log(err)
  //     })
  // }

  msgDebugger("something comes~~~")

  if (desc.includes('Claim it quickly for a chance to win awesome rewards!')) {
    msgLogger('Try to get Valentines gift!!!')
    message.clickButton({ X: 0, Y: 0 })
      .then(() => {
        msgLogger('Get Valentines gift success!')
      })
      .catch(err => {
        msgLogger('Get gift failed QAQ')
        msgDebugger(err)
      })
  }

}

module.exports = { checkFestivalGift };