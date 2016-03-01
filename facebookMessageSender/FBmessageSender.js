var _username_ = "";
var _password_ = "";

var fs = require("fs");
var login = require("facebook-chat-api");

var timestamp = Math.round(new Date().getTime() / 1000.0);

var eventWrite = function(line) {
  fs.appendFile(__dirname + "/events.log", "messageScript | " + timestamp + " - " + line + "\n", function() {});
}
var eventWriteSync = function(line) {
  fs.appendFileSync(__dirname + "/events.log", "messageScript | " + timestamp + " - " + line + "\n");
}

var args = process.argv.slice(2);
if (args.length > 1) {
  _threadid = args[0];
  _message = args.slice(1).join(" ");
} else {
  eventWriteSync("Error: Invalid argument input")
  eventWriteSync("Your arguments: " + args.join(" "))
  eventWriteSync("Usage: node '" + process.argv[1] + "' (threadid) (message)");
  process.exit(1);
}

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
      return eventWrite(JSON.stringify(err));
    }
  }
  if (cont) {
    fs.writeFileSync(__dirname + '/.appstate.json', JSON.stringify(api.getAppState()));
    api.setOptions({
      listenEvents: false,
      forceLogin: false,
      logLevel: "silent",
    });
    eventWrite('Sending message to ' + _threadid);

    api.sendMessage({
      body: _message.replace(/\\n/g, '\n'),
    }, _threadid, function(err, res) {
      if (err) {
        eventWrite("Error: " + err.error);
      } else {
        eventWrite("Message successfully sent");
        eventWrite(JSON.stringify(res));
      }
    });
  }
}

login({
  appState: fs.existsSync(__dirname + '/.appstate.json') ? JSON.parse(fs.readFileSync(__dirname + '/.appstate.json', 'utf8')) : "",
  email: _username_,
  password: _password_,
}, application);
