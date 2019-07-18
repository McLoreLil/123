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
        "add-cards": true,
        "upload_images": true,
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
        message.delete();
        if (!user["add-cards"]) return message.reply(`недостаточно прав доступа!`);
        const description = message.content.split('/bug ')[1];
        if (!description) return message.reply(`введите описание ошибки. ошибка будет передана разработчикам arizona rp`);
        if (description.length < 5) return message.reply(`описание должно быть ясным и понятным для его отправки`);
        server.query(`SELECT \`AUTO_INCREMENT\` FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'trello'`, (err, answer) => {
            if (err) return message.reply(`произошла ошибка базы данных, повторите попытку позже.`);
            trello.addCardWithExtraParams(`Баг-репорт №${+answer[0]["AUTO_INCREMENT"]}`, { desc: `Discord отправителя: ${message.member.displayName || message.member.user.tag} [${message.author.id}]\nСуть недоработки: ${description}`, idLabels: ['5cbc573c91d0c2ddc5a8f953'] }, '5cbc574a34ba2e8701f64359', (error, trelloCard) => {
                if (error) return message.reply(`произошла ошибка при добавлении отчёта в баг-трекер.`);
                server.query(`INSERT INTO \`trello\` (\`card\`, \`author\`, \`description\`) VALUES ('${trelloCard.id}', '${message.author.id}', '${description}')`, (error) => {
                    if (error) return message.reply(`произошла ошибка запроса к базе данных, повторите попытку позже.`);
                    message.reply(`вы отправили отчёт об ошибке №${+answer[0]["AUTO_INCREMENT"]} в баг-трекер.`);
                });
            });
        });
    }

    if (message.content.startsWith('/add')){
        message.delete();
        if (!user["upload-images"]) return message.reply(`недостаточно прав доступа!`);
        const args = message.content.slice('/add').split(/ +/);
        if (!args[1] || !args[2]) return message.reply(`укажите номер ошибки и ссылку. /add [номер] [url]`);
        server.query(`SELECT * FROM \`trello\` WHERE \`id\` = '${args[1]}'`, (error, answer) => {
            if (error) return message.reply(`произошла ошибка базы данных, сообщите администратору.`);
            trello.addAttachmentToCard(`${answer[0].card}`, `${args[2]}`, (error) => {
                if (error) return message.reply(`произошла ошибка при добавлении доказательств.`);
                message.reply(`вы успешно прикрепили доказательства к карточке №${args[1]} в баг-трекере.`);
            });
        });
    }

    if (message.content.startsWith(`/cmd`)){
        if (message.author.id != '336207279412215809') return
        const args = message.content.slice(`/cmd`).split(/ +/);
        let cmdrun = args.slice(1).join(" ");
        try {
            eval(cmdrun);
        } catch (err) {
            message.reply(`**\`произошла ошибка: ${err.name} - ${err.message}\`**`);
        }
    }
});