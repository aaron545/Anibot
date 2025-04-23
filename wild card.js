const { wildCardGuild = '' } = require('./config.json');
const { messageExtractor } = require('./helper');

function checkWildCard(message) {
  if (wildCardGuild === '') return;
  if (message.guildId != wildCardGuild) return;
  if (message.channelId != '1235893917824581763') return;
  let [title, desc] = messageExtractor(message);

  if (title.includes('Successfully claimed by')){
    message.delete()
      .then(() => {
        console.log('Delete collection message!')
      })
  }

  if (desc.includes('A wild AniGame card appears!')) {
    console.log('Try to get wild card!!!')
    message.clickButton({ X: 0, Y: 0 })
      .then(() => {
        console.log('Get wild card success!')
        return message.delete();
      })
      .then(() => {
        console.log('Wild card message deleted!');
      })
      .catch(err => {
        console.log('Get wild failed QAQ')
        console.log(err)
      })
  }
  if (desc.includes('Claim it quickly for a chance to win awesome rewards!')) {
    console.log('Try to get Valentines gift!!!')
    message.clickButton({ X: 0, Y: 0 })
      .then(() => {
        console.log('Get Valentines gift success!')
      })
      .catch(err => {
        console.log('Get gift failed QAQ')
        console.log(err)
      })
  }

}

module.exports = { checkWildCard };