"use strict";

var 
  handbrake = require("handbrake-js"),
  util = require('util'),
  path = require("path"),
  fs = require("fs"),
  EventEmitter = require('events').EventEmitter, 
  _ = require('underscore'),
  uid = require('uid2');
  
var Encoder = function (options) {
    // Module variables
    this.fileEncodeOptions = _.defaults({}, options, {
        encoder: "x264",
        "keep-display-aspect":true,
        modulus:16,
        vb:"2500",
        quality:"20",
        "crop":"0:0:0:0"});
    this.encodeStates = {};
    this.events = new EventEmitter();
};

_.extend(Encoder.prototype, {
    encode: function (input, outputDir) {
        var _encoder = this;
        var id = uid(24);
        var theseEvents = new EventEmitter();

        var encodeState = theseEvents.encodeState = _encoder.encodeStates[id] = {
            id: id,
            input: input,
            output: outputDir + '/' + id
        };
        var encOptions = _.extend({}, _encoder.fileEncodeOptions, {
            input: encodeState.input
            , output: encodeState.output
        });
        console.log("Adding to encode QUEUE: ", encOptions);

        handbrake.spawn(encOptions)
            .on('error', function (err) {
                console.log('Error while encoding ', encodeState, ': ', err);
                delete _encoder.encodeStates[id];
                err.encodeState = encodeState;
                theseEvents.emit('error', err);
            })
            .on('progress', function (progress) {
                encodeState.progress = progress;
                theseEvents.emit( 'progress', encodeState);
            })
            .on("complete", function(params) {
                console.log("FINISH encoding ", encodeState, "\n\t");
                encodeState.progress = 'complete';
                delete _encoder.encodeStates[id];
                theseEvents.emit('complete', encodeState);
                _encoder.events.emit('encodingComplete', encodeState);
            });

        theseEvents.emit('start', encodeState);
        _encoder.events.emit('encodingStart', encodeState);
        return theseEvents;
    }
});


module.exports = function (options) {
    return new Encoder(options);
};
