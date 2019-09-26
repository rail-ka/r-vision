const { spawn } = require('child_process')
const readline = require('readline')
const path = require('path')
const fs = require('fs')
const { DateTime } = require('luxon')

const now = () => DateTime.utc().toFormat('HH:mm:ss')

const log = (...args) => console.log(now(), ...args)
const error = (...args) => console.error(now(), ...args)

const connect = (readStream, writeStream, errWriteStream, { host, connection, connectionArgs }) => {
  return new Promise((res, rej) => {
    readline.emitKeypressEvents(readStream)
    // TODO: not work
    // readStream.setRawMode(false)
    // readStream.setRawMode(true)
    // process.on('SIGCONT', () => {
    //   process.stdin.setRawMode(false)
    //   process.stdin.setRawMode(true)
    // })

    const completer = (line, callback) => {
      // readline.clearLine(rl.input, 0)
      callback(null, [])
      subProcess.stdin.write(`${line}\t`)
    }

    const rl = readline.createInterface({
      input: readStream,
      output: writeStream,
      terminal: true,
      crlfDelay: Infinity,
      // TAB complete
      completer,
    })

    // TODO: not work...
    // rl.input.setRawMode(false)
    // rl.input.setRawMode(true)

    // TODO: not work...
    // readStream.on('keypress', (data) => { // any keypress event
    //   // const code = data ? data.charCodeAt(0) : ''
    //   // code && write(code, String.fromCharCode(code))
    //   // if (code === 9) { // tab
    //   //   // command.stdin.write(data)
    //   //   write(true)
    //   // }
    // })

    log(`Connecting to ${host}...`)

    const subProcess = spawn('ssh', ['-tt', ...connectionArgs])

    // TODO: в действительности ssh еще не подключился
    // log('Connection successful.')

    subProcess.stdout.setEncoding('utf-8')

    subProcess.stdout.pipe(writeStream)
    subProcess.stderr.pipe(errWriteStream)

    subProcess.on('close', code => {
      log(`child process close with code ${code}`)
      res([null, subProcess])
    })

    const getRemotePath = (callback) => {
      subProcess.stdout.unpipe(writeStream)
      const chunks = []

      const readLine = readline.createInterface({
        input: subProcess.stdout
      })

      const cmd = 'echo $(pwd)'

      readLine.on('line', line => {
        chunks.push(line)
        if (chunks.length === 2) {
          readLine.close()
          subProcess.stdout.pipe(writeStream)
          callback(chunks[1])
        }
      })

      subProcess.stdin.write(`${cmd}\n`)
    }

    /*
    * only for small files
    * */
    const getRemoteFile = (remoteFilePath, callback) => {
      subProcess.stdout.unpipe(writeStream)
      let linesCount = 0

      const r = readline.createInterface({
        input: subProcess.stdout
      })

      const cmd = `(xxd -p ${remoteFilePath} | tr -d '\n') && echo`

      r.on('line', line => {
        linesCount += 1
        if (linesCount === 3) {
          r.close()
          subProcess.stdout.pipe(writeStream)
          callback(line)
        }
      })

      subProcess.stdin.write(`${cmd}\n`)
    }

    // NOTE: configure ssh config for use one connection
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
            if (!remoteDir) {
              remoteDir = '/root'
            }
            const remoteFilePath = path.resolve(remoteDir, remoteFile)

            const remote = `${connection}:${remoteFilePath}`

            log(`Downloading from ${host}:${remoteDir} to 127.0.0.1:${currentWorkDirPath}`)

            const copyProcess = spawn('scp', [remote, currentWorkDirPath])

            copyProcess
              .on('close', code => {
                if (code === 0) {
                  log('File is downloaded successfully')
                  const localFilePath = path.resolve(currentWorkDirPath, remoteFile)
                  res([localFilePath, subProcess])
                } else {
                  error(`copy closed with code ${code}`)
                }
              })
              .on('error', err => {
                error(err)
                rej([err, subProcess])
              })
          })
        } else if (args[1] === '-n') {
          // get -n <filename>

          const remoteFile = args[2]
          const currentWorkDirPath = process.cwd()

          getRemotePath((remoteDir) => {
            if (!remoteDir) {
              remoteDir = '/root'
            }
            const remoteFilePath = path.resolve(remoteDir, remoteFile)
            const localFilePath = path.resolve(currentWorkDirPath, remoteFile)

            getRemoteFile(remoteFilePath, (file) => {
              const data = Buffer.from(file, 'hex').toString('utf-8')
              fs.writeFile(localFilePath, data, (err) => {
                if (err) {
                  error(err)
                  rej([err, subProcess])
                } else {
                  log('File is downloaded successfully')
                  res([localFilePath, subProcess])
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
          if (!remoteDir) {
            remoteDir = '/root'
          }
          const local = path.resolve(currentWorkDirPath, localFile)
          const remote = `${connection}:${remoteDir}`

          log(`Downloading from ${host}:${remoteDir} to 127.0.0.1:${currentWorkDirPath}`)

          const copyProcess = spawn('scp', [local, remote])

          copyProcess
            .on('close', code => {
              if (code === 0) {
                log('copy close', code)
              } else {
                const err = `copy closed with code ${code}`
                error(err)
                rej([err, subProcess])
              }
            })
            .on('error', err => {
              error(err)
              rej([err, subProcess])
            })
        })
      } else {
        subProcess.stdin.write(`${line}\n`)
      }
    })

    rl.on('close', () => {
      log('rl close')
      // subProcess.kill()
    })
  })
}

module.exports = connect
