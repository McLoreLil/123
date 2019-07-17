const Discord = require('discord.js');
const Trello = require("trello");

const bot = new Discord.Client();
const trello = new Trello(process.env.application_key, process.env.user_token);

const allow_servers = [
    '543799835652915241' // Спец.Администрация Arizona Games;
];

const allow_users = {
    "336207279412215809": {
        "add-cards": true
    }
};

bot.login(process.env.token);

bot.on('ready', () => {
    console.log(`Бот был успешно запущен!`);
});

bot.on('message', async (message) => {
    if (message.channel.type == "dm") return
    if (message.author.bot) return
    if (!allow_servers.some(server => message.guild.id == server)) return
    let user = allow_users["336207279412215809"]
    if (!user) return
    
    if (message.content.startsWith('/bug')){
        if (!user["add-cards"]) return message.reply(`недостаточно прав доступа!`);
        const description = message.content.split('/bug ')[1];
        if (!description) return message.reply(`введите описание ошибки. ошибка будет передана разработчикам arizona rp`);
        if (description.length < 5) return message.reply(`описание должно быть ясным и понятным для его отправки`);
        trello.addCard(`Bug Report #${new Date().valueOf()}`, `${description}`, `5d2c6bc16cfdd530bb00d786`, (error, trelloCard) => {
            if (error) return message.reply(`произошла ошибка при добавлении отчёта в баг-трекер.`);
            message.reply(`вы отправили отчёт об ошибке в баг-трекер.`);
        });
    }
});