"use strict";
var 
  upload = require('jquery-file-upload-middleware'),
  fs = require('fs'),
  os = require('os'),
  path = require('path');

module.exports = function(app, appEvents) {
  var 
    subExt = "vtt",
    fileDir = app.get("fileDir"),
    uploadDir = app.get('uploadDir');

    console.log('uploaddir = ', uploadDir);
  
  upload.configure({
    tmpDir: os.tmpDir(),
    uploadDir: uploadDir,
    uploadUrl: '/upload'
  });

  var onUploadEnd = function(fileinfo) {
    var 
      filename = fileinfo.name,
      extension = fileinfo.extension = filename.substr(filename.lastIndexOf(".")+1),
      fm = upload.fileManager();

      fileinfo.path = path.join(uploadDir, filename);

    // if(extension != subExt) {
    //   fm.move(fileinfo.name, "./../../" + fileDir, function(err){ 
    //     if(err)
    //       console.log(err);
    //   });

      appEvents.emit('startEncoding', {
          sourceInfo: fileinfo
      });
  };

  app.use("/upload", upload.fileHandler());
  upload.on("end", onUploadEnd);
  return upload;
}
