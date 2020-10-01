var axios = require('axios')
var ethers = require('ethers')


// TODO: Input chainId, support version #, have the reference frontend support version #s
//       possibly contract addresses to watch
//       Change to generic PrizePoolCreated

// bot permissions:
// permissions = 2048
// client.channels.get('761067343123447808').send('Test')

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

  postToDiscord(poolCreatedArgs)
})



// Force starting events from this block; for this example
provider.resetEventsBlock(7278097)


const postToDiscord = async ({ creator, prizePool }) => {
  const axiosInstance = axios.create({
    timeout: 7000
  })
  const url = `https://reference-app.pooltogether.com/pools/rinkeby/${prizePool}`

  try {
    const body = {
      'embeds': [
        {
          'title': 'Rinkeby: New prize pool created! :rocket:',
          'description': url,
          url,
          'color': 3066993,
          'author': {
            'name': 'P-Tee',
            url,
            'icon_url': 'https://pbs.twimg.com/profile_images/1222559698060267520/I7qXovx4_400x400.jpg'
          },
          'footer': {
            'text': `${new Date().toLocaleString()} - Created by: ${creator}`
            //  ${ shorten(creator) }
          }
        }
      ]
    }

    const response = await axiosInstance.post(
      process.env.WEBHOOK_URL,
      body
    )
    
    console.log(response.data)
  } catch (error) {
    console.error('There was an issue:', error.message)
    console.log(error)
  }
}
