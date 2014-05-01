'use strict';

var 
    express = require('express'),
    app = express(),
    fs = require('fs'),
    deployDir = "./build/",
    config = require(deployDir + "config.js");

function arrToObj(arr){
    var a = {};
    var i = arr.length;
    while(i--)
        a[arr[i]] = true;

    return a;
}

app.set("port",config.port);
app.set("movieExtensions", arrToObj(config.movieExtensions));
app.set("movieDir", deployDir + config.movieDir);
app.set("encodeDir", deployDir + config.encodeDir);
app.set("uploadDir", deployDir + 'uploads');

var 
    port = app.get("port") || 8080,
    video = require('./routes/videos')(app),
    upload = require('./routes/upload')(app),
    encoder = require('./lib/encoder')()
    encode = require('./routes/encode')(app,encoder),
    setup = require('./routes/setup')(app),
    os = require("os");



// processing pipeline

upload.on('end', encode.startEncode);

app.set('view engine', 'jade');
app.set('views', deployDir + 'views');
app.enable('strict routing');

// use the static router
app.use(express.static(deployDir));


// Routes
app.get('/', function (req, res, next) {
    video.getMovies(function(videos) {
        encoder.getProcessing(function(processing) {
            var out = {
                "videos":videos.slice(0,10),
                "processing":processing
            };
            res.render("index",out);
        })
    })
});

//Static route to force static file download
app.get('/dl/*/*', function(req, res){
    var path = req.path;
    var fileName = path.substr(path.lastIndexOf("/")+1);
    var videoDir = 'wallpapers/';
    var sysVideoDir = deployDir + videoDir;
    
    res.set({
        "Content-type":"application/download"
    })
    res.sendfile(sysVideoDir + fileName);
});

app.listen(port);
console.log('Get to app at http://' + os.hostname() + ":" + port);

