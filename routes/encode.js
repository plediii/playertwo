"use strict";

var 
  handbrake = require("handbrake-js"),
  dirExp = require("node-dir"),
  util = require('util'),
  path = require("path"),
  fs = require("fs"),
  EventEmitter = require('events').EventEmitter,
  _ = require('underscore');


module.exports = function(app, appEvents, encoder) {
    var // App level variables
    encodeDir = "./build/encode",
    videoDir = "./build/videos",
    PATHSEP = path.sep,
    movieExt = 'mp4';

    var startEncode = function(vid) {
        var fileInfo = vid.fileInfo
        console.log('start encode ', fileInfo);
        var encoding = encoder.encode(fileInfo.path, './build/encode')
            .on('error', function (err) {
                console.log('Error while encoding: ', err);
            })
            .on('start', function (encodeState) {
                vid.encodeState = encodeState;
            })
            .on('complete', function (encodeState) {
                var fileName = fileInfo.name;
                var lastDot = fileName.lastIndexOf('.');
                var withoutExt = (lastDot > 0) ? fileName.substr(0, lastDot) : fileName
                var endName = videoDir + "/" + withoutExt + '.' + movieExt;
                fs.rename(vid.output, endName, function(err) {
                    if (err) {
                        console.log('Error renameing ', err);
                        return;
                    }

                    vid.videopath = endName
                    appEvents.emit('available', vid);

                    fs.unlink(vid.input, function(err){
                        if (err) {
                            console.log('Error unlinking ', vid.input, err);
                            return;
                        }
                    });
                });
            });
    };

    appEvents.on('startEncoding', startEncode);


    app.get("/encode/status/:filename", function(req, res, next) {
        
        if(!req.params.filename) { // Either video was finished encoding or never existed
            res.send(400);
            return;
        }

        var filename = req.params.filename;

        if(!encoder.encodeStates.hasOwnProperty(filename)) {
            res.send(404);
        } else {
            res.json(encoder.encodeStates[filename].progress)
        }
    });

    app.get('/encode', function(req, res, next) {
        console.log("GET: encode");
        getProcessing(function(videoList) {
            res.render("encode",{"processing":videoList});
        });
    });

    app.get('/get/processing', function(req, res, next) {
        console.log("GET processing videos JSON list");
        getProcessing(function(videoList) {
            res.json(videoList)
        });
    });  

    /*
      Get a list of the videos currently being encoded
    */
    var getProcessing = function(cb) {
        var videoList = _.map(encoder.encodeStates, function (vid) {
            return {
                filename: path.basename(vid.input),
                name: vid.id
            };
        });
        console.log("videoList: \n\t" + util.inspect(videoList));
        return cb(videoList);
    };

    return {
        getProcessing: getProcessing,
        startEncode: startEncode
    };
};
