var _ = require('highland')
var recordedStream = require('../index').recordedStream
var fs = require('fs-extra')

describe("stream recorder", function() {

  process.env.FIXTURE_DIR = fixtureDir

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

  beforeEach(function (callback) {
    fs.remove(process.env.FIXTURE_DIR, callback)
  })

  it("records a stream when none exists", function(callback) {
    var recordedExample = recordedStream(exampleStreamGetter, 'example')
    var exampleStream = recordedExample('test error', 10)
    exampleStream
      .done(function () {
        fs.stat(exampleStream.streamFile, function (err, stat) {
          expect(err).toBe(null) // file exists
          callback()
        })
      })
  });

//  it("records different streams given different arguments", function() {
//  });
//
//  it("replays a stream when one is available", function() {
//  });

});

