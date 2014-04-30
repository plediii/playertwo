"use strict";

var 
  handbrake = require("handbrake-js"),
  util = require('util'),
  path = require("path"),
  fs = require("fs"),
  EventEmitter = require('events').EventEmitter, 
  _ = require('underscore'),
  uid = require('uid2');
  
var Encoder = module.exports = function (options) {
    // Module variables
    this.fileEncodeOptions = _.defaults({}, options, {
        encoder: "x264",
        "keep-display-aspect":true,
        modulus:16,
        vb:"2500",
        quality:"20",
        "crop":"0:0:0:0"});
    this.encodeStates = {};
};

_.extend(Encoder.prototype, {
    encode: function (input, outputDir) {
        var _encoder = this;
        var id = uid(24);
        var events = new EventEmitter();

        var vid = events.vid = _encoder.encodeStates[id] = {
            id: id,
            input: input,
            output: outputDir + '/' + id
        };
        var encOptions = _.extend({}, _encoder.fileEncodeOptions, {
            input: vid.input
            , output: vid.output
        });
        console.log("Adding to encode QUEUE: ", encOptions);


        handbrake.spawn(encOptions)
            .on('error', function (err) {
                console.log('Error while encoding ', vid, ': ', err);
                delete _encoder.encodeStates[id];
                err.vid = vid;
                events.emit('error', err);
            })
            .on('progress', function (progress) {
                vid.progress = progress;
                events.emit( 'progress', vid);
            })
            .on("complete", function(params) {
                console.log("FINISH encoding ", vid, "\n\t");
                vid.progress = 'complete';
                delete _encoder.encodeStates[id];
                events.emit('complete', vid);
            });

        return events;
    }
});