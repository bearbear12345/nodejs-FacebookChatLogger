/* user credentials */
var _username_ = "";
var _password_ = "";

/* application settings */
var _logdir_ = __dirname + "/logs";
var _downloadsdir_ = __dirname + "/downloads";

//////////////////////////////////////////////////
// Let's not edit anything below here shall we? //
//      (Unless you know what you're doing)     //
//////////////////////////////////////////////////

function main() {

  var login = require("facebook-chat-api");

  var fs = require('fs');
  var path = require('path');
  var https = require('https');

  var writeFormattedLine = function(line, threadID) {
    return fs.appendFile(_logdir_ + "/" + threadID + ".log", line.replace(/\n/g, '\\n') + "\n", function() {});
  }

  var debugWrite = function(line) {
    console.log('\x1b[36m' + (line_ = Math.round(new Date().getTime() / 1000.0)) + '\x1b[0m' + " - " + line)
    fs.appendFile("debug.log", line_ + "\n", function() {});
  }

  fs.mkdirParent = function(dirPath, mode, callback) {
    fs.mkdir(dirPath, mode, function(error) {
      if (error && error.code == 'ENOENT') {
        fs.mkdirParent(path.dirname(dirPath), mode, fs.mkdirParent.bind(this, dirPath, mode, callback));
      } else if (callback) callback(error);
    });
  }

  var download = function(url, dest, file, cb) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest);
    }
    var file = fs.createWriteStream(dest + "/" + file);
    var request = https.get(url, function(response) {
      response.pipe(file);
      file.on('finish', function() {
        file.close(cb);
      });
    }).on('error', function(err) {
      fs.unlink(dest);
      if (cb) cb(err.message);
    });
  };

  var iterateAttachments = function(event) {
    for (x = 0; x < event.attachments.length; x++) {
      var fileinfo = event.attachments[x];
      switch (fileinfo.type) {
        case "file":
          var localloc = event.timestamp + "_" + fileinfo.ID + " (" + fileinfo.name + ")." + fileinfo.name.split(".").pop();
          writeFormattedLine(event.timestamp + " | " + event.senderID + " | " + event.senderName_ + " | CHAT | FILE | '" + localloc + "'", event.threadID);
          download(fileinfo.url, _downloadsdir_ + "/thread/" + event.threadID, localloc);
          break;
        case "photo":
          var localloc = event.timestamp + "_" + fileinfo.ID + "." + (fileinfo.filename.split(".").pop()||"unknown");
          writeFormattedLine(event.timestamp + " | " + event.senderID + " | " + event.senderName_ + " | CHAT | IMAGE | '" + localloc + "'", event.threadID);
          download(fileinfo.hiresUrl, _downloadsdir_ + "/thread/" + event.threadID, localloc);
          break;
        case "sticker":
          writeFormattedLine(event.timestamp + " | " + event.senderID + " | " + event.senderName_ + " | CHAT | STICKER | Sticker " + fileinfo.packID + "/" + fileinfo.stickerID, event.threadID);
          download(fileinfo.url, _downloadsdir_ + "/sticker/" + fileinfo.packID, fileinfo.stickerID + ".png")
          break;
        case "animated_image":
          writeFormattedLine(event.timestamp + " | " + event.senderID + " | " + event.senderName_ + " | CHAT | IMAGE | Animated Gif - ... meh", event.threadID);
          break;
        default:
          debugWrite('found new attachment type - ' + fileinfo.type);
      }
    }
  }

  fs.mkdirParent(_logdir_);
  fs.mkdirParent(_downloadsdir_);
  fs.mkdirParent(_downloadsdir_ + "/thread");
  fs.mkdirParent(_downloadsdir_ + "/sticker");

  var application = function(err, api) {
    var cont = true;
    if (err) {
      if (err.error == "Error retrieving userID. This can be caused by a lot of things, including getting blocked by Facebook for logging in from an unknown location. Try logging in with a browser to verify.") {
        cont = false;
        login({
          email: _username_,
          password: _password_
        }, application);
      } else {
        return console.log(err);
      }
    }

    if (cont) {
      fs.writeFileSync(__dirname + '/.appstate.json', JSON.stringify(api.getAppState()));
      api.setOptions({
        logLevel: "error",
        selfListen: true,
        listenEvents: true
      });
      api.listen(function callback(err, event) {

        if (err) {
          debugWrite('error - ' + JSON.stringify(err));
          return;
        }
        debugWrite(JSON.stringify(event))
        if (typeof event !== "undefined") {
          switch (event.type) {
            case "message":
              if (event.senderName !== undefined) {
                  if (event.body != "") {
                    event.senderName_ = event.participantNames[event.participantIDs.indexOf(parseInt(event.senderID))]
                    writeFormattedLine(event.timestamp + " | " + event.senderID + " | " + event.senderName_ + " | CHAT | MESSAGE | " + event.body, event.threadID);
                  }
                  if (event.body == "" || event.attachments.length > 0) {
                    iterateAttachments(event);
                    break;
                  }
              }
              break;
            case "event":
              switch (event.logMessageType) {
                case "log:thread-name":
                  writeFormattedLine(Date.now() + " | " + event.author + " | " + event.logMessageBody.substr(0, event.logMessageBody.indexOf(' named ')) + " | EVENT | TITLE | " + event.logMessageData['name'], event.threadID);
                  break;
                case "log:subscribe":
                  writeFormattedLine(Date.now() + " | " + event.author + " | " + event.logMessageBody.substr(0, event.logMessageBody.indexOf(' added ')) + " | EVENT | JOIN | " + event.logMessageBody, event.threadID);
                  break;
                case "log:unsubscribe":
                  writeFormattedLine(Date.now() + " | " + event.author + " | " + event.logMessageBody.substr(0, event.logMessageBody.indexOf(' removed ')) + " | EVENT | LEAVE | " + event.logMessageBody, event.threadID);
                  break;
              }
              break;
            default:
              break;
          }
        }
      });
    }
  }
  login({
    appState: fs.existsSync(__dirname + '/.appstate.json') ? JSON.parse(fs.readFileSync(__dirname + '/.appstate.json', 'utf8')) : "",
    email: _username_,
    password: _password_,
  }, application);
}

main();
