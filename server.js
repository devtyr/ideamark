/* ideamark
 * A simple nodejs concept/documentation store supporting markdown
 * 
 * Based on this-blog by Dusko Jordanovski <jordanovskid@gmail.com>
 * 
 * Author: Norbert Eder <wpfnerd+nodejs@gmail.com>
 */

var path    = require('path');
var fs      = require('fs');
var options = require('optimist').argv;
var winston = require('winston');
var watcher = require('./libs/watcher');

global.supportedExtensions = [ ".md", ".markdown" ];

global.settings = JSON.parse(fs.readFileSync(path.join(__dirname, 'settings.json'), 'utf-8'));
settings.root   = __dirname.replace(/\/+$/, "");
global.cache    = { posts: {}, tags: {}, menus: {}, order: [], checksums: {} };
global.logger   = new (winston.Logger)({
  exitOnError: false,
  transports:  [
    options.p || options.publish
      ? new (winston.transports.Console)({ handleExceptions: true, filename: settings.errorLog }) 
      : new (winston.transports.File)({ handleExceptions: true, filename: settings.errorLog })
  ]
})

// These have to be included after we parse the settings file
var utils   = require('./libs/utils');
var server  = require('./libs/server');
var client  = require('./libs/client');

console.log("Updating local files cache ...");

// Settings file checksum
utils.updateFile(fs.ReadStream(path.join(settings.root, 'settings.json')), path.join(settings.root, 'settings.json'));

var counter = 0;

settings.contentDirs.forEach(function(dir){

  if (settings.watchFiles) {
    // we want to watch files, so there is no need to use caching for posts
    settings.useCaching = false;

    watcher.addDirectoryWatch(dir, function(completeFileName) {
      utils.updatePost(fs.ReadStream(completeFileName), completeFileName, {}, null);
    });
  }

  utils.crawl(path.join(settings.root, dir), function(filepath) {
    counter++;
    var extname = path.extname(filepath);
    utils[supportedExtensions.indexOf(extname) !== -1 ? 'updatePost' : 'updateFile'](fs.ReadStream(filepath), filepath, {}, function(){
      if(--counter){
        return;
      }
      if(options.p || options.publish) {
        client.publish();
      }
      else if(options.s || options.serve) {
        require('http').createServer(server).listen(settings.port);
        console.log("Serving this blog on " + settings.server + ":" + settings.port);
      }
      else {
        console.log("\nUsage:\n");
        console.log("blog.js --serve (-s) to start the server.");
        console.log("blog.js --publish (-p) to publish your latest changes.");
        console.log("Edit settings.json to change settings.\n");
      }
    });
    
  });
});