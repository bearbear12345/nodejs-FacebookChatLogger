var _logdir_ = "~/fbchatlogs";
var _username_ = "";
var _password_ = "";

//////////////////////////////////////////////////
// Let's not edit anything below here shall we? //
//      (Unless you know what you're doing)     //
//////////////////////////////////////////////////

var login = require("facebook-chat-api");
var fs = require('fs');

function iterateAttachments(event) {
  for (x = 0; x < event.attachments.length; x++) {
    var fileinfo = event.attachments[x];
    switch (fileinfo.type) {
      case "file":
        writeFormattedLine(event.timestamp + " | " + event.senderID + " | " + event.senderName + " | CHAT | FILE | " + "'" + fileinfo.name + "' - " + fileinfo.url, event.threadID);
        continue;
      case "photo":
        writeFormattedLine(event.timestamp + " | " + event.senderID + " | " + event.senderName + " | CHAT | IMAGE | " + fileinfo.hiresUrl, event.threadID);
        continue;
      case "sticker":
        writeFormattedLine(event.timestamp + " | " + event.senderID + " | " + event.senderName + " | CHAT | STICKER | Sticker " + fileinfo.stickerID + " of pack " + fileinfo.packID + " - " + fileinfo.url, event.threadID);
        continue;
    }
  }
}

function writeFormattedLine(line, threadID) {
  //console.log(line)
  return fs.appendFile(_logdir_ + "/" + threadID + ".log", line + "\n", function() {});
}

login({
  email: _username_,
  password: _password_
}, function callback(err, api) {
  if (err) return console.error(err);
  api.setOptions({
    logLevel: "silent",
    selfListen: true,
    listenEvents: true
  });
  api.listen(function callback(err, event) {
    if (typeof lastname !== "undefined") {
      switch (event.type) {
        case "message":
          if (event.body != "") {
            writeFormattedLine(event.timestamp + " | " + event.senderID + " | " + event.senderName + " | CHAT | MESSAGE | " + event.body, event.threadID);
          }
          if (event.body == "" || event.attachments.length > 0) {
            iterateAttachments(event);
            return;
          }
        case "event":
          switch (event.logMessageType) {
            case "log:thread-name":
              writeFormattedLine(Date.now() + " | " + event.author + " | " + event.senderName + " | EVENT | TITLE | " + event.logMessageData['name'], event.threadID);
              return;
            case "log:subscribe":
              writeFormattedLine(Date.now() + " | " + event.author + " | " + event.logMessageBody.substr(0, event.logMessageBody.indexOf(' added ')) + " | EVENT | JOIN | " + event.logMessageBody, event.threadID);
              return;
            case "log:unsubscribe":
              writeFormattedLine(Date.now() + " | " + event.author + " | " + event.logMessageBody.substr(0, event.logMessageBody.indexOf(' removed ')) + " | EVENT | LEAVE | " + event.logMessageBody, event.threadID);
              return;
          }
      }
    }
  });
});
