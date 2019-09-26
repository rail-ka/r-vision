const connect = require('./connect')

const { argv } = process
const connection = argv[argv.length - 1]
const connectionArgs = argv.splice(2)

const connectionParams = connection.split('@')
const host = connectionParams[1] ? connectionParams[1] : connectionParams[0]

connect(process.stdin, process.stdout, process.stderr, {
  host,
  connection,
  connectionArgs,
})
