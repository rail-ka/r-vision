const { assert } = require('chai');
const { it, describe } = require('mocha')
const connect = require('./connect')
const fs = require('fs')

// TODO: сделать тесты независимыми от запускаемого компьютера
const config = {
  host: 'bilet',
  connection: 'bilet',
  connectionArgs: ['-L 9000:localhost:9000', '-R 9001:localhost:9001', 'bilet'],
}

describe('SSH connect', () => {
  it('Should connect and get file from remote host', function(done) {
    this.timeout(20000);

    const readStream = fs.createReadStream('test_data.txt', {
      encoding: 'utf-8',
      autoClose: false,
    })
    const writeStream = fs.createWriteStream('ssh_logs')
    const errWriteStream = fs.createWriteStream('ssh_errors')

    readStream.on('open', () => {
      console.log('read open')
    }).on('close', () => {
      console.log('read close')
    })
    writeStream.on('open', () => {
      console.log('write open')
    }).on('close', () => {
      console.log('write close')
    })

    readStream.on('ready', () => {
      console.log('read ready')
      writeStream.on('ready', () => {
        console.log('write ready')
        connect(readStream, writeStream, errWriteStream, config).then(([localFilePath, subProcess]) => {
          console.log('connect resolve')
          if (localFilePath) {
            fs.readFile(localFilePath, (err, data) => {
              console.log('file to be read')
              assert(err == null, 'Error should be null')
              assert(data, 'Data should be not null')
              readStream.close()
              writeStream.close()
              subProcess.kill()
              done()
            })
          } else {
            subProcess.kill()
          }
        }).catch(([err, subProcess]) => {
          console.error(err)
          readStream.close()
          writeStream.close()
          subProcess.kill()
          done()
        })
      })
    })
  })
})
