var Discord = require('discord.io');
var logger = require('winston');
var auth = require('./auth.json');
var fs = require('fs');
//General things
var helpMessage = fs.readFileSync("./data/help.txt", { "encoding": "utf8"});
var greetMessage = fs.readFileSync("./data/greet.txt", { "encoding": "utf8"});
//bot's ready status
var ready = true;
//Allow bot to send message only once a second
var date = new Date();
var timeSinceLastMessage = date.getTime();
var minMessageCooldown = 1000;
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
    bot.setPresence( {game:{name:"unranked"}} );
});
bot.on('message', function (user, userID, channelID, message, evt) {
    var WELCOME_CHANNEL_ID = 362748030568497173
    if(channelID == WELCOME_CHANNEL_ID){
        console.log(userID + " said " + message + " in welcome channel.");
    }
    // Our bot needs to know if it will execute a command
    // It will listen for messages that will start with `!`
    if (message.substring(0, 1) == '!') {
        var args = message.substring(1).split(' ');
        var cmd = args[0];
       
        args = args.splice(1);
        switch(cmd) {
            // !help
            case 'help':
                sendMessageToChannel(channelID,helpMessage);
            break;
            // !greet
            case 'greet':
                sendMessageToChannel(channelID,greetMessage);
            break;
            // !ping
            case 'ping':
                var message = 'Pong!';
                sendMessageToChannel(channelID,message);
            break;
            // !thisisrocketleague
            case 'thisisrocketleague':
	            var RLVoiceID = "508436966564560903";
	            playAudioInChannel(RLVoiceID,'./data/thisisrocketleague.mp3');
            break;
        }
     }
});

function sendMessageToChannel(channelID, msg, tts=false) {
    bot.sendMessage({
                to: channelID,
                message: msg,
                tts: tts
            });
}

function playAudioInChannel(channelID, audioPath) {
    if(ready){
        ready = false;
        console.log("Starting Audio for " + audioPath);
        //Let's join the voice channel, the ID is whatever your voice channel's ID is.
        bot.joinVoiceChannel(channelID, function(error, events) {
            //Check to see if any errors happen while joining.
            if (error) return console.error(error);
            //Then get the audio context
            bot.getAudioContext(channelID, function(error, stream) {
                //Once again, check to see if any errors exist
                if (error) return console.error(error);
                //Create a stream to your file and pipe it to the stream
                //Without {end: false}, it would close up the stream, so make sure to include that.
                fs.createReadStream(audioPath).pipe(stream, {end: false});
                //The stream fires `done` when it's got nothing else to send to Discord.
                stream.on('done', function() {
                    ready = true;
                    console.log("Finished Audio");
                    bot.leaveVoiceChannel(channelID);
                });
            });
        });
    }
}