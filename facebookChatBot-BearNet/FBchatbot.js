/* User Credentials */
var _username_ = ""; // Bot username
var _password_ = ""; // Bot password
var _ownerid = ""; // Owner's numerical facebook id
var _commandprefix = "/"; // Usual prefixes - / ! .

//////////////////////////////////////////////////
// Let's not edit anything below here shall we? //
//(Unless you know what you're doing) //
//////////////////////////////////////////////////

function main() {
  var handleCommand = function(command, arguments, api, callback) {
    var commands = {
      title: function(arguments) {
        if (arguments === undefined) {
          callback({
            type: "INFO",
            message: "Command " + _commandprefix + command + " requires an argument!\nUsage: " + _commandprefix + command + " (title)"
          })
        } else {
          api.setTitle(arguments)
        }
      },
      botid: function() {
        result.message = "Bot ID: " + api.getCurrentUserID();
      },
    };

    try {
      var result = {
        message: '',
        threadID: ''
      };
      if (commands[command]) {
        commands[command]();
        callback(undefined, result);
      } else {
        callback({
          type: "INFO",
          message: "Command " + _commandprefix + command + " does not exist!"
        })
      }
    } catch (err) {
      callback({
        type: 'FATAL',
        message: err
      })
    }
  }
  var application = function(api) {
    api.listen(function callback(err, event) {
        if (err) {
          debugWrite('error - ' + JSON.stringify(err));
          if (_ownerid) api.sendMessage("Chat Bot Error: ", _ownerid);
          return;
        }
        if (event.type == "message") {

          // Do we want to pass the arguments as a string, or an array? "a b" or ["a", "b"]
          var command;
          var arguments;
          var cleanbody = event.body.replace(/+/g, ' ');
          if ((spacePosition = cleanbody.indexOf(" ")) == -1) {
            command = cleanbody.toLowerCase();
          } else {
            command = cleanbody.substr(0, spacePosition).toLowerCase();
            arguments = cleanbody.substr(0, spacePosition + 1);
          }

          handleCommand(command, arguments, api, function(error, result) {
              if (error) {
                if (error.type == "INFO") {
                  api.sendMessage("Error! " + error.message, event.threadID)
                } else if (error.type == "FATAL") {
                  if (_ownerid) api.sendMessage("Chat Bot Error:\n" + error.message, _ownerid);
                }
              }
              if (result.message) {
                api.sendMessage(message, result.threadID ? result.threadID : event.threadID)
              }

            );

          }
        });
    }
  }

  var login = require("facebook-chat-api");
  var fs = require('fs');

  var debugWrite = function(line) {
    console.log(line_ = Math.round(new Date().getTime() / 1000.0) + " - " + line)
    fs.appendFile("chatbot_debug.log", line_ + "\n", function() {});
  }

  var loginFunc = function(err, api) {
    var cont = true;
    if (err) {
      if (err.error == "Error retrieving userID. This can be caused by a lot of things, including getting blocked by Facebook for logging in from an unknown location. Try logging in with a browser to verify.") {
        cont = false;
        login({
          email: _username_,
          password: _password_
        }, loginFunc);
      } else {
        return console.log(err);
      }
    }

    if (cont) {
      fs.writeFileSync(__dirname + '/.chatbot_appstate.json', JSON.stringify(api.getAppState()));
      api.setOptions({
        logLevel: "error",
      });
      application(api);
    }
  }
  login({
    appState: fs.existsSync(__dirname + '/.chatbot_appstate.json') ? JSON.parse(fs.readFileSync(__dirname + '/.chatbot_chatbot.json', 'utf8')) : "",
    email: _username_,
    password: _password_,
  }, loginFunc);
}

main();