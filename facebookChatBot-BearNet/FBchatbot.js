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
	var handleCommand = function(command, arguments, event, api, callback) {
		
		 // Set up result object for successful command
		 var result = {
			message: '', // Result message
			threadID: '' // (optional) Thread to send response to - Default: caller thread
		};
		
		// Check if arguments are present (if needed) then run command
		var assertCommandArguments = function(command, arguments) {
			if (commands[command].hasOwnProperty('args')) { // Check if command needs arguments
				if (arguments === undefined) { // Check if arguments are present	
					// Callback (INFO error) with correct command usage information
					callback({
						type: "INFO",
						message: "Command " + _commandprefix + command + " requires an argument!\nUsage: " + _commandprefix + command + " " + commands[command]['args']
					})
				} else {
					commands[command].exec(arguments); // Run command
				}
			} else {
				commands[command].exec(arguments); // Run command
			}
		}
		var commands = { // Declare commands here
/*			Command format: 
				{
				desc: "...",
				args: "(ARG1) (ARG2) ..." OPTIONAL
				exec: function(){...}
				}
*/
			settitle: {
				desc: "Changes the chat title (group chats only)",
				args: "(title)",
				exec: function(arguments) {api.setTitle(arguments, event.threadID)}
				},
			botid: {
				desc: "Gets the ID of the bot",
				exec: function() {result.message = "Bot ID: " + api.getCurrentUserID()}
				},
		};

		try {
			// Check if command exists
			if (commands[command]) { 
				assertCommandArguments(command, arguments)
				callback(undefined, result);
			} else {
			// Command doesn't exist, throw error
				callback({
					type: "INFO",
					message: "Command " + _commandprefix + command + " does not exist!"
				})
			}
		} catch (err) {
			// Runtime error occured, message bot owner
			callback({
				type: 'FATAL',
				message: err
			})
		}
	}
	var application = function(api) {
		api.listen(function callback(err, event) {
			if (err) {
				debugWrite('error - ' + JSON.stringify(err)); // Write error to debug log
				if (_ownerid) api.sendMessage("Chat Bot Error: ", _ownerid); // Tell bot owner of the error
				return;
			}

			if (event.type == "message") {
				var strA;
				var strB;
				var command;
				var cleanbody = event.body.replace(/ +/g, ' '); // Replace double/triple/quadruple/etc whitespaces into a single whitespace
				if ((spacePosition = cleanbody.indexOf(" ")) == -1) { // Check if a space exists in the input (a space indicated a following argument)
					strA = cleanbody.toLowerCase(); // Convert the command to lowercase
				} else {
					// Split the input into two variables
					strA = cleanbody.substr(0, spacePosition).toLowerCase(); 
					strB = cleanbody.substr(spacePosition + 1);
				}

				if (strA.length > _commandprefix.length && strA.startsWith(_commandprefix)) command = strA; // Set the command if strA validates as a variable
				if (command) {
					handleCommand(command.replace(_commandprefix, ""), strB, event, api, function(error, result) {
						if (error) {
							if (error.type == "INFO") {
								api.sendMessage("Error! " + error.message, event.threadID)
							} else if (error.type == "FATAL") {
								if (_ownerid) api.sendMessage("Chat Bot Error:\n" + error.message, _ownerid);
							}
							return;
						}
						if (result.message) {
							api.sendMessage(result.message, result.threadID ? result.threadID : event.threadID) // Send message to either the original thread or a specified thread, depending on the command result
						}
					});
				}
			}
		});
	}

	var login = require("facebook-chat-api");
	var fs = require('fs');

	var debugWrite = function(line) {
		console.log(line_ = Math.round(new Date().getTime() / 1000.0) + " - " + line)
		fs.appendFile("chatbot_debug.log", line_ + "\n", function() {});
	}

/* Session / U&P combination login */
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
		appState: fs.existsSync(__dirname + '/.chatbot_appstate.json') ? JSON.parse(fs.readFileSync(__dirname + '/.chatbot_appstate.json', 'utf8')) : "",
		email: _username_,
		password: _password_,
	}, loginFunc);
}

// Let's go! @.@
main();