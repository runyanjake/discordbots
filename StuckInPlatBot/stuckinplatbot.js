var Discord = require('discord.io');
var logger = require('winston');
var auth = require('./auth.json');
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
    bot.setPresence( {game:{name:"tilted as fuck"}} );
});
bot.on('message', function (user, userID, channelID, message, evt) {
	// Bot comments on things containing plat (but not if it sent the message)
	if((message.toUpperCase().includes("PLAT") || message.toUpperCase().includes("PLATINUM")) && userID != bot.id){
		var d = new Date();
		var now = d.getTime();
		if(now-timeSinceLastMessage > minMessageCooldown){
			timeSinceLastMessage = now;
			var message = '```You have angered StuckInPlatBot by uttering his trigger word.```';
			sendMessageToChannel(channelID, message, true);
		}
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
           	 	var message = 'Hi, I\'m StuckInPlat Bot! I would have gotten GC last season but my teammates were all braindead monkeys playing with their eyes closed.';
                sendMessageToChannel(channelID,message);
            break;
            // Just add any case commands if you want to..
            case 'ping':
                var message = 'Pong!';
                sendMessageToChannel(channelID,message);
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