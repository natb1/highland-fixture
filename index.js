var _ = require('highland')
var path = require('path')
var CryptoJS = require('crypto-js')
var fs = require('fs-extra')

exports.recordedStream = function (streamGetter, name) {
  console.log('[highland-fixture] patching', name)
  var fixtureDir = process.env.FIXTURE_DIR
  fixtureDir = fixtureDir || path.join(process.cwd(), '.fixtures')
  return function () {
    var self = this
    var args = arguments
    var argID = CryptoJS.MD5(JSON.stringify(args)).toString()
    var streamFile = path.join(fixtureDir, name+'.'+argID+'.stream')
    var wrappedStream = _(function (push, next) {
      fs.stat(streamFile, function (err, stat) {
        if (err == null) {
          push(null, true)
        } else if (err.code == 'ENOENT') {
          push(null, false)
        } else {
          push(err, null)
        }
        push(null, _.nil)
      })
    })
    .flatMap(function (exists) {
      if (exists) {
        console.log('[highland-fixture]', 'using recorded stream', streamFile)
        console.log(args)
        return _.wrapCallback(fs.readFile)(streamFile)
          .filter(function (data) { return data != '' }) // stream is not empty
          .split()
          .map(JSON.parse)
      } else {
        console.log('[highland-fixture]', 'recording stream', streamFile)
        return _.wrapCallback(fs.ensureFile)(streamFile)
          .flatMap(function () {
            var stream = streamGetter.apply(self, args)
            var cache = stream.fork()
            var downstream = stream.fork()
            cache.resume()
            downstream.resume()
            cache
              .map(JSON.stringify)
              .intersperse('\n')
              .flatMap(function (line) {
                return _.wrapCallback(fs.appendFile)(streamFile, line)
              })
              .errors(function (err, push) {
                console.log('[highland-fixture]', 'WARNING', 
                            'error not recored', err)
              })
              .done(function () {})
            return downstream
          })
      }
    })
    wrappedStream.streamFile = streamFile
    return wrappedStream
  }
}
