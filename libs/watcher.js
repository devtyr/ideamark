/* ideamark - watcher
 * 
 * file watcher
 *
 * Author: Norbert Eder <wpfnerd+nodejs@gmail.com>
 */

var path    = require('path');
var fs      = require('fs');
var util	= require('util');

global.watcherCache = [];

exports.addDirectoryWatch = function(dir, callback) {
	fs.exists(dir, function(exists) {
		if (exists) {
			var watcher = fs.watch(dir, {}, function(event, filename) {
				var extname = path.extname(filename);
		        if (filename && global.supportedExtensions.indexOf(extname) !== -1 && event === 'change') {
		          console.log("[" + event + "] " + "Updating " + filename + " ...");
		          
		          var completeFileName = path.join(dir, filename);
		          callback(completeFileName);
		        }	
			});
			global.watcherCache.push(watcher);
			console.log("Watching " + dir + " for changes ...");
		}
	});
}

exports.removeAllWatches = function(dir) {
	for (var i = 0; i < global.watcherCache.length; i++) {
		var watcher = global.watcherCache[i];
		watcher.close();
	}
	global.watcherCache = [];
}