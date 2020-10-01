const Discord = require('discord.js')
const ethers = require('ethers')
const winston = require('winston')




const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  defaultMeta: { service: 'user-service' },
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple(),
  }));
}


// TODO: Switch on chainId
//       support version #? have the reference frontend support version #s?
//       possibly contract addresses to watch
//       Change to generic PrizePoolCreated

const client = new Discord.Client()

client.on('ready', () => {
  logger.info(`Ready n' Logged in as ${client.user.tag}!`)
})


// const expression = /^(\w{6})\w*(\w{4})$/

// const shorten = (hash) => {
//   let result

//   if (!hash) { return null }

//   result = expression.exec(hash)

//   return `${result[1]}..${result[2]}`
// }


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
    "name": "PrizePoolCreated",
    "type": "event"
  }
]




let provider = ethers.getDefaultProvider('rinkeby', {
  alchemy: process.env.ALCHEMY_API_KEY,
})

const prizePoolBuilderAddress = '0xAE17b0BA282FBb24e5ba050C56302c02D2CF6c31'
const prizePoolBuilderContract = new ethers.Contract(
  prizePoolBuilderAddress,
  abi,
  provider
)

let topic = ethers.utils.id('PrizePoolCreated(address,address,address)')
// let topic = ethers.utils.id('CompoundPrizePoolCreated(address,address,address)')

let filter = {
  topics: [topic]
}




const getLogs = async (_result) => {
  try {
    const eventLog = prizePoolBuilderContract.interface.parseLog(
      _result
    )

    const creator = eventLog.args.creator
    const prizePool = eventLog.args.prizePool

    return {
      creator,
      prizePool
    }
  } catch (e) {
    logger.error(e)
  }
}


provider.on(filter, async (result) => {
  const poolCreatedArgs = await getLogs(result)

  logger.info(`found result!`, poolCreatedArgs.creator, poolCreatedArgs.prizePool)

  sendDiscordMsg(poolCreatedArgs)
})


provider.resetEventsBlock(7294830)

const sendDiscordMsg = async ({creator, prizePool}) => {
  const url = `https://reference-app.pooltogether.com/pools/rinkeby/${prizePool}`

  await client.login(process.env.TOKEN)
  const channel = await client.channels.fetch('761067343123447808')
  channel.send(`New prize pool! :person_swimming: ${url}`)

  logger.info(`sent msg with url ${url}`)
}
