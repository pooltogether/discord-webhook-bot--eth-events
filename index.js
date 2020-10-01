const Discord = require('discord.js')
// const axios = require('axios')
const ethers = require('ethers')


// TODO: Input chainId, support version #, have the reference frontend support version #s
//       possibly contract addresses to watch
//       Change to generic PrizePoolCreated

// bot permissions:
// permissions = 2048

const client = new Discord.Client()

client.on('ready', () => {
  console.log(`Ready n' Logged in as ${client.user.tag}!`)
})

// client.on('message', msg => {
//   if (msg.content === 'ping') {
//     msg.reply('Pong!')
//   }
// })




const expression = /^(\w{6})\w*(\w{4})$/

const shorten = (hash) => {
  let result

  if (!hash) { return null }

  result = expression.exec(hash)

  return `${result[1]}..${result[2]}`
}





const abi = [
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "creator",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "prizePool",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "prizeStrategy",
        "type": "address"
      }
    ],
    "name": "CompoundPrizePoolCreated",
    "type": "event"
  }
]




let provider = ethers.getDefaultProvider('rinkeby',
  {
    etherscan: process.env.ETHERSCAN_API_KEY,
  }
)

const prizePoolBuilderAddress = '0xAE17b0BA282FBb24e5ba050C56302c02D2CF6c31'
const prizePoolBuilderContract = new ethers.Contract(
  prizePoolBuilderAddress,
  abi,
  provider
)

// let topic = ethers.utils.id('PrizePoolCreated(address,address,address)')
let topic = ethers.utils.id('CompoundPrizePoolCreated(address,address,address)')

let filter = {
  topics: [topic]
}




const getLogs = async (_result) => {
  try {
    const eventLog = prizePoolBuilderContract.interface.parseLog(
      _result
    )

    const creator = eventLog.args.prizePool
    const prizePool = eventLog.args.prizeStrategy

    return {
      creator,
      prizePool
    }
  } catch (e) {
    console.error(e)
  }
}


provider.on(filter, async (result) => {
  const poolCreatedArgs = await getLogs(result)

  sendDiscordMsg(poolCreatedArgs)
})


provider.resetEventsBlock(7278097)

const sendDiscordMsg = async ({creator, prizePool}) => {
  const url = `https://reference-app.pooltogether.com/pools/rinkeby/${prizePool}`

  await client.login(process.env.TOKEN)
  const channel = await client.channels.fetch('761067343123447808')
  channel.send(`New prize pool! :person_swimming: ${url}`)
}
