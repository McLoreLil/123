const Discord = require('discord.js');
const Trello = require("trello");
const mysql = require('mysql');

const bot = new Discord.Client();
const trello = new Trello(process.env.application_key, process.env.user_token);
const server = mysql.createConnection({
    host     : process.env.host,
    user     : process.env.user,
    password : process.env.password,
    database : process.env.database,
});
server.connect(function(err){
    if (err) return console.log('[MYSQL] Ошибка подключения к базе MySQL');
    console.log('[MYSQL] Вы успешно подключились к базе данных.');
    server.query("SET SESSION wait_timeout = 604800");
});

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
        server.query(`SELECT LAST_INSERT_ID()`, (error, answer) => {
            if (error) return message.reply(`произошла ошибка базы данных, повторите попытку позже.`);
            trello.addCardWithExtraParams('test', {
                "desc": 'test2',
                "labels": "Баг"
            }, `5d2c6bc16cfdd530bb00d786`, (err) => {
                if (err) console.error(err);
            });
            trello.addCard(`Баг-репорт №${+answer[0] + 1}`, `${description}`, `5d2c6bc16cfdd530bb00d786`, (error, trelloCard) => {
                if (error) return message.reply(`произошла ошибка при добавлении отчёта в баг-трекер.`);
                server.query(`INSERT INTO \`trello\` (\`card\`, \`author\`, \`description\`) VALUES ('${trelloCard.id}', '${message.author.id}', '${description}')`, (error) => {
                    if (error) return message.reply(`произошла ошибка запроса к базе данных, повторите попытку позже.`);
                    message.reply(`вы отправили отчёт об ошибке №${+answer[0] + 1} в баг-трекер.`);
                });
            });
        });
    }
});