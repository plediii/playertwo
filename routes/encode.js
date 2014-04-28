"use strict";

var 
  handbrake = require("handbrake-js"),
  dirExp = require("node-dir"),
  util = require('util'),
  path = require("path"),
  fs = require("fs"),
  Encoder = require(__dirname + '/../lib/encoder').Encoder;

module.exports = function(app, upload) {
  var // App level variables
    encodeDir = "./build/encode",
    videoDir = "./build/videos",
    videoDir = "./build/upload",
    encoder = new Encoder();
    PATHSEP = path.sep;

  var serverConfig = function(app, upload) {
    upload.on("end", uploadFinished);
    setupRoutes(app);
  }

  var setupRoutes = function(app) {
    app.get("/encode/status/:filename", function(req, res, next) {
    
      if(!req.params.filename) { // Either video was finished encoding or never existed
        res.send(400);
        return;
      }

      var filename = req.params.filename;

      if(!encodeQueue[req.params.filename]) {
        res.send(404);
      } else {
        res.json(encodeQueue[filename])
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
  }

    var uploadFinished = function(fileInfo) {
        var inputName = uploadDir + '/' + fileInfo.name
        encoder.encode(inputName, './build/encode')
            .on('error', function (err) {
                console.log('Error while encoding: ', err);
            })
            .on('progress', function (vid) {

            })
            .on('complete', function (vid) {
                var endName = videoDir + "/" + fileInfo.name + movieExt;
                fs.rename(vid.output, endName, function(err) {
                    if (err) {
                        console.log('Error renameing ', err);
                        return;
                    }

                    fs.unlink(vid.input, function(err){
                        if (err) {
                            console.log('Error unlinking ', vid.input, err);
                            return;
                        }
                    });
                });
            });
    };

  /*
    Get a list of the videos currently being encoded
  */
  var getProcessing = function(cb) {
    var videoList = [];
    
    //Recursively get all files in dir
    dirExp.files(encodeDir, function(err,files) { if(err) console.log(err);
      console.log("getProcessing: " + util.inspect(files));

      if(!files)
          return cb(videoList);

      //Per video, construct a useful video object
      files.forEach(function(val,i,arr){
        var 
          filename = val.substr(val.lastIndexOf(PATHSEP)+1),
          name = filename.substr(0,filename.lastIndexOf("."));
        videoList.push({
          "name": name,
          "filename": filename
        });
      });
      
      console.log("videoList: \n\t" + util.inspect(videoList));
      
      return cb(videoList);
    });
  }

  if(arguments.length == 2) {
    serverConfig(app, upload);
    return {"getProcessing": getProcessing};
  } else {
    // cli init
    console.log('console init');
    var encodeVid = function(file, out) {
      fileEncodeOptions.input = file;
      fileEncodeOptions.output = out;

      return handbrake.spawn(fileEncodeOptions)
    }

    return {
      encode:encodeVid
    };
  }
}
