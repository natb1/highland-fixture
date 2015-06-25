var _ = require('highland')
var recordedStream = require('../index').recordedStream
var fs = require('fs-extra')

describe("stream recorder", function() {

  var exampleStreamGetter = function (err, max) {
    var count = 0
    return _(function (push, next) {
      setTimeout(function () {
        if (count === max) {
          push(err, { count: count })
          push(null, _.nil)
        } else {
          push(null, { count: count })
          count += 1
          next()
        }
      }, 0)
    })
  }

  describe("given no existing fixtures", function () {

    beforeEach(function (callback) {
      process.env.FIXTURE_DIR = '.test'
      fs.remove(process.env.FIXTURE_DIR, callback)
    })

    it("records a stream", function(callback) {
      var recordedExample = recordedStream(exampleStreamGetter, 'example')
      var exampleStream = recordedExample('test error', 0)
      exampleStream
        .errors(function (err, push) { console.log(err) })
        .done(function () {
          fs.stat(exampleStream.streamFile, function (err, stat) {
            expect(err).toBe(null) // recorded stream file exists
            callback()
          })
        })
    });

    it("records different streams given different arguments", function() {
      var recordedExample = recordedStream(exampleStreamGetter, 'example')
      var firstExampleStream = recordedExample('test error', 10)
      var secondExampleStream = recordedExample('test error', 20)
      expect(firstExampleStream.streamFile)
        .not.toEqual(secondExampleStream.streamFile)
    });

  })

  describe("given an existing stream", function () {

    var test_input = [0, 10]

    beforeEach(function () {
      process.env.FIXTURE_DIR = '.fixtures' 
    })

    test_input.map(function (count) {
      it("replays the stream", function(callback) {
        var recordedExample = recordedStream(exampleStreamGetter, 'example')
        var exampleStream = recordedExample('test error', count)
          .errors(function (err, push) { console.log(err) })
          .done(function () {
            // TODO: how to test? currently I just verify the console output
            expect(true).toBe(true)
            callback()
          })
      });
    })
  })

});

