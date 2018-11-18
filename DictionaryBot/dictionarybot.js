var Discord = require('discord.io');
var logger = require('winston');
var auth = require('./auth.json');
var fs = require('fs');
//General things
var helpMessage = fs.readFileSync("./data/help.txt", { "encoding": "utf8"});
var greetMessage = fs.readFileSync("./data/greet.txt", { "encoding": "utf8"});
//Allow bot to send message only once a second
var date = new Date();
var timeSinceLastMessage = date.getTime();
var minMessageCooldown = 1000;
//Initialize ictionary contents
var jsonFilePath = './data/contents.json';
var contents = null;
updateDictionaryContents();
// Configure logger settings
logger.remove(logger.transports.Console);
logger.add(new logger.transports.Console, {
    colorize: true
});
logger.level = 'debug';
// Initialize Discord Bot
var bot = new Discord.Client({
   token: auth.token,
   autorun: true
});
bot.on('ready', function (evt) {
    logger.info('Connected');
    logger.info('Logged in as: ');
    logger.info(bot.username + ' - (' + bot.id + ')');
    bot.setPresence( {game:{name:"with the English language"}} );
});
bot.on('message', function (user, userID, channelID, message, evt) {
    // Our bot needs to know if it will execute a command
    // It will listen for messages that will start with `!`
    if (message.substring(0, 1) == '!') {
        var args = message.substring(1).split(' ');
        var cmd = args[0];
       
        args = args.splice(1);
        switch(cmd) {
            // !help
            case 'help':
                sendDirectMessage(userID,helpMessage);
            break;
            // !greet
            case 'greet':
                sendDirectMessage(userID,greetMessage);
            break;
            // !ping
            case 'ping':
                var message = 'Pong!';
                sendMessageToChannel(channelID,message);
            break;
            // !definition
            case 'definition':
                var val = message.substring(message.indexOf("\"")+1, message.lastIndexOf("\""));
                if(args.length < 2){
                    sendDirectMessage(userID,"Hi, my !definition command was called incorrectly. Use `!definition [word] \"[definition]\"` to set it properly!");
                }else{
                    var key = args[0];
                    var formattedKey = formatDictionaryKey(key);
                    if(!isValidDictionaryKey(formattedKey)){
                        sendDirectMessage(userID,"Sorry, '" + key + "' is not a valid key. Please try to rename it.");
                    }else if(val.length < 3){
                        sendDirectMessage(userID,"Sorry, I recognized a definition that was too short. (I recognized `" + val + "`) Make sure you enclosed your definition in double quotes, ex: `!definition jake \"supreme overlord\"`");
                    }else if(existsInDictionary(formattedKey)){
                        sendDirectMessage(userID,"Sorry, '" + key + "' is defined already. You can `!redefine` or `!undefine` it to make a change (see my !help page for syntax).");
                    }else{
                        if(addToDictionary(formattedKey, val)){
                            sendDirectMessage(userID,"Congratulations, the definition for `" + key + "` was updated successfully to `" + val + "`.\n\nIf this wasn't what you wanted, you may have misformatted the command or forgotten quotes around your definition. ex: `!definition jake \"supreme overlord\"`. You can !redefine or !undefine your definition to undo it.");
                        }else{
                            sendDirectMessage(userID,"Sorry, something went wrong and it wasn't your fault. Try it again or report a bug.");
                        }
                    }
                }
            break;
            // !define
            case 'define':
                if(args.length != 1){
                    sendDirectMessage(userID,"Hi, my !define command was called incorrectly. Use `!define [word]` to use it properly!");
                }else{
                    var word = args[0];
                    var formattedKey = formatDictionaryKey(word);
                    if(!existsInDictionary(formattedKey)){
                        var msg = "`" + word + "` hasn't been defined yet! Anyone can update the definition with `!definition`.";
                        sendMessageToChannel(channelID, msg);
                    }else{
                        var defn = "`" + word + "` - " + defineWord(formattedKey);
                        sendMessageToChannel(channelID, defn);
                    }
                }
            break;
            // !redefine
            case 'redefine':
                var val = message.substring(message.indexOf("\"")+1, message.lastIndexOf("\""));
                if(args.length < 2){
                    sendDirectMessage(userID,"Hi, my !redefine command was called incorrectly. Use `!redefine [word] \"[definition]\"` to set it properly!");
                }else{
                    var key = args[0];
                    var formattedKey = formatDictionaryKey(key);
                    if(!isValidDictionaryKey(formattedKey)){
                        sendDirectMessage(userID,"Sorry, '" + key + "' is not a valid key. Please try to rename it.");
                    }else if(val.length < 3){
                        sendDirectMessage(userID,"Sorry, I recognized a definition that was too short. (I recognized `" + val + "`) Make sure you enclosed your definition in double quotes, ex: `!definition jake \"supreme overlord\"`");
                    }else if(!existsInDictionary(formattedKey)){
                        sendDirectMessage(userID,"Sorry, '" + key + "' isn't in the dictionary yet. You can !definition it if you want to add it in. See my documentation.");
                    }else{
                        if(redefineEntry(formattedKey, val)){
                            sendDirectMessage(userID,"Congratulations, the definition for `" + key + "` was updated successfully to `" + val + "`.\n\nIf this wasn't what you wanted, you may have misformatted the command or forgotten quotes around your definition. ex: `!definition jake \"supreme overlord\"`. You can !redefine or !undefine your definition to undo it.");
                        }else{
                            sendDirectMessage(userID,"Sorry, something went wrong and it wasn't your fault. Try it again or report a bug.");
                        }
                    }
                }
            break;
            // !undefine
            case 'undefine':
                if(args.length != 1){
                    sendDirectMessage(userID,"Hi, my !undefine command was called incorrectly. Use `!undefine [word]` to use it properly!");
                }else{
                    var word = args[0];
                    var formattedKey = formatDictionaryKey(word);
                    if(!existsInDictionary(formattedKey)){
                        var msg = "`" + word + "` doesn't exist or was already deleted.";
                        sendMessageToChannel(channelID, msg);
                    }else{
                        if(deleteEntry(formattedKey)){
                            sendDirectMessage(userID,"The definition for `" + word + "` was deleted successfully.");
                        }else{
                            sendDirectMessage(userID,"Sorry, something went wrong and it wasn't your fault. Try it again or report a bug.");
                        }
                    }
                }
            break;
            // !words
            case 'words':
                sendDirectMessage(userID, getDictionaryContents());
            break;
         }
     }
});

//Loads Dictionary from disk. Not to be used when updating/modifying contents.
//Intended for first time load only.
function updateDictionaryContents(){
    //NOTE: THIS WILL FAIL IF FILE DOESNT EXIST. ADD CHECKS/CREATE FILE IF NOTEXISTS.
    contents = null;
    contents = require(jsonFilePath);
};

//Keys are formatted by omitting whitespace and 
function formatDictionaryKey(key){
    var re = /\s+/g;
    var k = key.toLowerCase().replace(re, "");
    return k;
}

//Return true if valid key, false if not. 
//(CALL UPON RETURN VALUE FROM formatDictionaryKey(k) )
function isValidDictionaryKey(key){
    if(key == "") return false;
    if(key.indexOf("\"") != -1) return false;
    return true;
}

//Adds to dictionary and mirrors change to files on disk.
//Returns true after successful insertion.
function addToDictionary(key, val){
    if(!existsInDictionary(key)){
        contents[key] = val;
        var json = JSON.stringify(contents);
        fs.writeFile(jsonFilePath, json, 'utf8', function(){});
        return true;
    }
    return false;
};

//Checks non-disk (in-memory version) of dictionary to verify existance of key value pair.
//Returns true if exists.
function existsInDictionary(key){
    if(contents[key] == undefined)
        return false;
    return true;
};

//Redefines dictionary entry and mirrors change to files on disk.
//Returns true after successful redefinition.
function redefineEntry(key,val){
    if(existsInDictionary(key)){
        contents[key] = val;
        var json = JSON.stringify(contents);
        fs.writeFile(jsonFilePath, json, 'utf8', function(){});
        return true;
    }
    return false;
};

//Deletes dictionary entry and mirrors change to files on disk.
//Returns true after successful deletion.
function deleteEntry(key){
    if(existsInDictionary(key)){
        delete contents[key];
        var json = JSON.stringify(contents);
        fs.writeFile(jsonFilePath, json, 'utf8', function(){});
        return true;
    }
    return false;
}

//defines a word, assuming it exists and that existsInDictionary returns true.
function defineWord(key){
    return contents[key];
}

//returns string representation of Dictionary.
function getDictionaryContents(){
    var msg = "Dictionary Contains:\n";
    for(var thing in contents){
        msg += "\t'" + thing + "' : " + contents[thing] + "\n";
    }
    return msg;
}

function sendMessageToChannel(channelID, msg, tts=false) {
    bot.sendMessage({
                to: channelID,
                message: msg,
                tts: tts
            });
}

function sendDirectMessage(userID, msg) {
    bot.sendMessage({
                to: userID,
                message: msg
            });
}