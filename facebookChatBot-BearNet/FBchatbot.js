/* User Credentials */
var _username_ = ""; // Bot username
var _password_ = ""; // Bot password
var _ownerid = ""; // Owner's numerical facebook id
var _commandprefix = "/"; // Usual prefixes - / ! .

var _botadmins = []; // Numerical facebook ids of bot administrators (more command permission)

//////////////////////////////////////////////////
// Let's not edit anything below here shall we? //
//     (Unless you know what you're doing)      //
//////////////////////////////////////////////////


Array.prototype.hasItem = function(item) {return this.indexOf(item) > -1 ? true : false} // Array extension to check for an item
	
_botadmins.forEach(function(id, i){_botadmins[i] = id.toString()}) // Convert (int) ids into (str) ids // Ensures that both ids as either strings or numbers work.

function main() {
	var titleLock = { // Title locking utilities
		// data storage
		data: {},
		// retrieve thread title, else return false
		tryGet: function(id){return this.data.hasOwnProperty(id) ? this.data[id] : false;},
		// store data storage to disk
		writeFS: function(){fs.writeFileSync(__dirname + '/.chatbot_titleLock.json', JSON.stringify(this.data))},
		// read data storage from disk
		readFS: function(){this.data = fs.existsSync(__dirname + '/.chatbot_titleLock.json') ? JSON.parse(fs.readFileSync(__dirname + '/.chatbot_titleLock.json', 'utf8')) : {}},
		// registers title lock
		register: function(id, title){this.data[id] = title; this.writeFS();},
		// unregisters title lock
		unregister: function(id){delete this.data[id]; this.writeFS();},
	}

	var botID;
	var isAdmin = function(id) {return _ownerid == id || _botadmins.hasItem(id)}; // Boolean - Check if admin
	var handleCommand = function(command, arguments, event, api, callback) {
		var isGroup = event.participantIDs.length > 2;

		// Set up result object for successful command
		var result = {
			message: '', // Result message
			threadID: '' // (optional) Thread to send response to - Default: caller thread
		};
		
		// Check if arguments are present (if needed) then run command
		var assertCommandArguments = function(command, arguments) {
			if (!isGroup && commands[command].hasOwnProperty('groupOnly') && commands[command]['groupOnly']) {
				callback({
					type: "INFO",
					message: "This command only works in a group chat"
				})
			}
			else if (commands[command].hasOwnProperty('args')) { // Check if command needs arguments
				if (!arguments) { // Check if arguments are present	
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
				groupOnly: true/false OPTIONAL
				args: "(ARG1) (ARG2) ..." OPTIONAL
				exec: function(){...}
				}
*/
			settitle: {
				desc: "Changes the thread title",
				groupOnly: true,
				args: "(title)",
				exec: function(arguments) {titleLock.tryGet(event.threadID) ? callback({type: "INFO", message: "Thread title locked."}) : api.setTitle(arguments, event.threadID)} // Sets title, or throws error
				},
			locktitle: {
				desc: "Lock thread title",
				groupOnly: true,
				exec: function() {
					// Admin only command
						if (isAdmin(event.senderID)) { // Check if admin
							if (!event.threadName) { // Check if the thread has a title set. If not, throw error							
								callback({
									type: "INFO",
									message: "The current thread does not have a title set. Cannot lock non-existent thread title.\nTry setting a title first?"
								})
							} else {
								if (!titleLock.tryGet(event.threadID)) { // If thread title is not locked
									titleLock.register(event.threadID, event.threadName) // then lock the thread title.
									result.message = "Thread title locked!";
								} else {
									callback({  // Error thrown if thread title is already locked
										type: "INFO",
										message: "Thread title is already locked."
									})
								}
							}
						} else {
							callback({ // Error thrown if the user is not an administrator
								type: "INFO",
								message: "You do not have permission to lock the thread title."
							})
						}
					}
				},
			unlocktitle: {
				desc: "Unlock thread title",
				groupOnly: true,
				exec: function() {
						if (isAdmin(event.senderID)) { // Check if admin
							if (titleLock.tryGet(event.threadID)) { // Check if thread title is locked, and unlock if so.
								titleLock.unregister(event.threadID);
								result.message = "Thread title unlocked!"
							} else {
								callback({ // Error thrown if thread title was never locked
									type: "INFO",
									message: "Thread title was never locked."
								})
							}
						} else {
							callback({ // Error thrown if the user is not an administrator
								type: "INFO",
								message: "You do not have permission to unlock the thread title."
							})
						}
					}
				},
			botid: {
				desc: "Gets the ID of the bot",
				exec: function() {result.message = "Bot ID: " + botID}
				},
			help: {
				desc: "Returns bot functions",
				exec: function() {
					var out = "";
					for (var key in commands) {
						out += _commandprefix + key + " " + (commands[key].hasOwnProperty('args') ? commands[key]['args'] + " " : "") + "- " + commands[key]['desc'] + ((commands[key].hasOwnProperty('groupOnly') && commands[key]['groupOnly']) ? " (group chats)" : "")+ "\n";
					}
					result.message = "Commands:\n" + out + "\n() - Required arguments\n<> [] {} - Optional arguments";
				}
			}
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
			if (botID != event.senderID || botID != event.author) {
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
						var commandParse = command.replace(_commandprefix, "")
						handleCommand(commandParse, strB, event, api, function(error, result) {
							if (error) {
								if (error.type == "INFO") {
									api.sendMessage("Error! " + error.message, event.threadID)
								} else if (error.type == "FATAL") {
									if (_ownerid) {
										if (event.threadID != _ownerid) {
											api.sendMessage("A fatal error occured, notifying bot owner...", event.threadID)
										}
										api.sendMessage("Erorr occured when running command '" + commandParse + " " + strB + "'\n" + error.message, _ownerid);
									}
								}
								return;
							}
							if (result.message) {
								api.sendMessage(result.message, result.threadID ? result.threadID : event.threadID) // Send message to either the original thread or a specified thread, depending on the command result
							}
						});
					}
				}
				else if (event.type == "event") {
					// On title change event, if the threadID is registered to be lock, change the title back.
					if (event.logMessageType == "log:thread-name") {
						if (titleLock.tryGet(event.threadID)) {
							if (titleLock.data[event.threadID] != event.logMessageData.name) {
								api.setTitle(titleLock.data[event.threadID], event.threadID);
							}
						} 
					}
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
				listenEvents: true,
			});
			botID = api.getCurrentUserID();
			titleLock.readFS(); // Get previously title-locked threads
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
