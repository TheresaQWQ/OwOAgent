const readline = require('readline')
const pipeline = require('./pipeline')
const rl = require('./lib/rl')
const colors = require('colors')

const input = (str) => {
  return new Promise((resolve, reject) => {
    rl.question(str, (answer) => {
      resolve(answer)
    })
  })
}

const main = async () => {
  while(true) {
    const msg = await input(require('./lib/time')() + 'You > '.green)
    await pipeline(msg)
  }
}

main();

process.on('SIGINT', () => {
  process.exit(0)
})
