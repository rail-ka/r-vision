const { spawn } = require('child_process')
const readline = require('readline')
const path = require('path')
const fs = require('fs')
const { DateTime } = require('luxon')

const now = () => DateTime.utc().toFormat('HH:mm:ss')

const log = (...args) => console.log(now(), ...args)
const error = (...args) => console.error(now(), ...args)

// const write = (...arr) => process.stdout.write(arr.join())

const { argv } = process
const connection = argv[argv.length - 1]
const connectionArgs = argv.splice(2)

const connectionParams = connection.split('@')
const host = connectionParams[1] ? connectionParams[1] : connectionParams[0]

const completer = (line, callback) => {
  // readline.clearLine(rl.input, 0)
  callback(null, [])
  subProcess.stdin.write(`${line}\t`)
}

readline.emitKeypressEvents(process.stdin)
// TODO: now work
process.stdin.setRawMode(false)
process.stdin.setRawMode(true)
process.on('SIGCONT', () => {
  process.stdin.setRawMode(false)
  process.stdin.setRawMode(true)
})

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  // TAB complete
  completer,
})

rl.input.setRawMode(false)
rl.input.setRawMode(true)

process.stdin.on('keypress', (data) => { // any keypress event
  const code = data ? data.charCodeAt(0) : ''
  // code && write(code, String.fromCharCode(code))
  // if (code === 9) { // tab
  //   // command.stdin.write(data)
  //   write(true)
  // }
})

log(`Connecting to ${host}...`)

const subProcess = spawn('ssh', ['-tt', ...connectionArgs])

// TODO: в действительности ssh еще не подключился
log('Connection successful.')

subProcess.stdout.setEncoding('utf-8')

subProcess.stdout.pipe(process.stdout)
subProcess.stderr.pipe(process.stderr)

subProcess.on('close', code => {
  log(`child process close with code ${code}`)
})

const getRemotePath = (callback) => {
  subProcess.stdout.unpipe(process.stdout)
  const chunks = []

  const r = readline.createInterface({
    input: subProcess.stdout
  })

  const cmd = 'echo $(pwd)'

  r.on('line', line => {
    chunks.push(line);
    if (chunks.length === 2) {
      r.close()
      subProcess.stdout.pipe(process.stdout)
      callback(chunks[1])
    }
  })

  subProcess.stdin.write(`${cmd}\n`)
}

/*
* only for small files
* */
const getRemoteFile = (remoteFilePath, callback) => {
  subProcess.stdout.unpipe(process.stdout)
  let linesCount = 0

  const r = readline.createInterface({
    input: subProcess.stdout
  })

  const cmd = `(xxd -p ${remoteFilePath} | tr -d '\n') && echo`

  r.on('line', line => {
    linesCount += 1
    if (linesCount === 3) {
      r.close()
      subProcess.stdout.pipe(process.stdout)
      callback(line)
    }
  })

  subProcess.stdin.write(`${cmd}\n`)
}

// TODO: configure ssh config for use one connection
rl.on('line', (line) => {
  const command = line.slice(0, 4)
  const get = 'get '
  const put = 'put '
  const args = line.split(' ')

  if (command === get && [2, 3].includes(args.length)) {
    if (args.length === 2) {
      // 'get <filename>'

      const remoteFile = args[1]
      const currentWorkDirPath = process.cwd()

      getRemotePath((remoteDir) => {
        const remoteFilePath = path.resolve(remoteDir, remoteFile)

        const remote = `${connection}:${remoteFilePath}`

        log(`Downloading from ${host}:${remoteDir} to 127.0.0.1:${currentWorkDirPath}`)

        const copyProcess = spawn('scp', [remote, currentWorkDirPath])

        copyProcess
          .on('close', code => {
            if (code === 0) {
              log('File is downloaded successfully')
            } else {
              error(`copy closed with code ${code}`)
            }
        })
          .on('error', error)
      })
    } else if (args[1] === '-n') {
      // get -n <filename>

      const remoteFile = args[2]
      const currentWorkDirPath = process.cwd()

      getRemotePath((remoteDir) => {
        const remoteFilePath = path.resolve(remoteDir, remoteFile)
        const localFilePath = path.resolve(currentWorkDirPath, remoteFile)

        getRemoteFile(remoteFilePath, (file) => {
          const str = Buffer.from(file, 'hex').toString('utf-8')
          fs.writeFile(localFilePath, str, (err) => {
            if (err) {
              error(err)
            } else {
              log('File is downloaded successfully')
            }
          })
        })
      })
    }
  } else if (command === put) {
    // 'put <filename>'

    const localFile = line.slice(4)
    const currentWorkDirPath = process.cwd()

    getRemotePath((remoteDir) => {
      const local = path.resolve(currentWorkDirPath, localFile)
      const remote = `${connection}:${remoteDir}`

      log(`Downloading from ${host}:${remoteDir} to 127.0.0.1:${currentWorkDirPath}`)

      const copyProcess = spawn('scp', [local, remote])

      copyProcess
        .on('close', code => {
          if (code === 0) {
            log('copy close', code)
          } else {
            error(`copy closed with code ${code}`)
          }
      })
        .on('error', error)
    })
  } else {
    subProcess.stdin.write(`${line}\n`)
  }
})

rl.on('close', () => {
  log('rl close')
  subProcess.kill()
  // process.exit() // not need
})
