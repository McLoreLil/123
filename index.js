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
        "add-impotatnt-cards": true,
        "change_status": true,
        "archive-cards": true,
        "delete-cards": true,
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
        if (description.length < 7) return message.reply(`описание должно быть ясным и понятным для его отправки`);
        server.query(`SELECT \`AUTO_INCREMENT\` FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'trello'`, (err, answer) => {
            if (err) return message.reply(`произошла ошибка базы данных, повторите попытку позже.`);
            trello.addCardWithExtraParams(`Баг-репорт №${+answer[0]["AUTO_INCREMENT"]}`, { desc: `Discord отправителя: ${message.member.displayName || message.member.user.tag} [${message.author.id}]\n_____\n${description}`, idLabels: ['5cbc573c91d0c2ddc5a8f953'] }, '5cbc574a34ba2e8701f64359', (error, trelloCard) => {
                if (error) return message.reply(`произошла ошибка при добавлении отчёта в баг-трекер.`);
                server.query(`INSERT INTO \`trello\` (\`card\`, \`author\`, \`description\`) VALUES ('${trelloCard.id}', '${message.author.id}', '${description}')`, (error) => {
                    if (error) return message.reply(`произошла ошибка запроса к базе данных, повторите попытку позже.`);
                    const embed = new Discord.RichEmbed().setDescription(`${description}`);
                    message.reply(`\`вы отправили отчёт об ошибке #${+answer[0]["AUTO_INCREMENT"]} в баг-трекер.\``, embed);
                });
            });
        });
    }

    if (message.content == '/generator'){
        if (!user["add-cards"]) return message.reply(`недостаточно прав доступа!`);
        message.delete();
        let ask_date = await message.reply(`\`укажите дату отправки жалобы на форуме.\``);
        message.channel.awaitMessages(response => response.member.id == message.member.id, {
            max: 1,
            time: 60000,
            errors: ['time'],
        }).then(async (collected) => {
            ask_date.delete();
            let answer_date = collected.first().content;
            collected.first().delete();
            let ask_name = await message.reply(`\`укажите сервер и ник отправителя.\``);
            message.channel.awaitMessages(response => response.member.id == message.member.id, {
                max: 1,
                time: 60000,
                errors: ['time'],
            }).then(async (collected) => {
                ask_name.delete();
                let answer_name = collected.first().content;
                collected.first().delete();
                let ask_url = await message.reply(`\`укажите ссылку на жалобу.\``);
                message.channel.awaitMessages(response => response.member.id == message.member.id, {
                    max: 1,
                    time: 60000,
                    errors: ['time'],
                }).then(async (collected) => {
                    ask_url.delete();
                    let answer_url = collected.first().content;
                    collected.first().delete();
                    let ask_steps = await message.reply(`\`укажите шаги воспроизведения.\``);
                    message.channel.awaitMessages(response => response.member.id == message.member.id, {
                        max: 1,
                        time: 60000,
                        errors: ['time'],
                    }).then(async (collected) => {
                        ask_steps.delete();
                        let answer_steps = collected.first().content;
                        collected.first().delete();
                        let ask_after = await message.reply(`\`укажите, что произошло после выполнения указанных действий.\``);
                        message.channel.awaitMessages(response => response.member.id == message.member.id, {
                            max: 1,
                            time: 60000,
                            errors: ['time'],
                        }).then(async (collected) => {
                            ask_after.delete();
                            let answer_after = collected.first().content;
                            collected.first().delete();
                            let ask_before = await message.reply(`\`укажите, что должно произойти после выполнения действий.\``);
                            message.channel.awaitMessages(response => response.member.id == message.member.id, {
                                max: 1,
                                time: 60000,
                                errors: ['time'],
                            }).then(async (collected) => {
                                ask_before.delete();
                                let answer_before = collected.first().content;
                                collected.first().delete();
                                const description = `**Дата отправки:** ${answer_date}\n**Автор жалобы: ${answer_name}**\n**Жалоба:** [клик](${answer_url})\n\n**Шаги воспроизведения:** ${answer_steps}\n\n**Фактический результат:** ${answer_after}\n\n**Ожидаемый результат:** ${answer_before}`;
                                if (!description) return message.reply(`введите описание ошибки. ошибка будет передана разработчикам arizona rp`);
                                if (description.length < 7) return message.reply(`описание должно быть ясным и понятным для его отправки`);
                                server.query(`SELECT \`AUTO_INCREMENT\` FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'trello'`, (err, answer) => {
                                    if (err) return message.reply(`произошла ошибка базы данных, повторите попытку позже.`);
                                    trello.addCardWithExtraParams(`Баг-репорт №${+answer[0]["AUTO_INCREMENT"]}`, { desc: `Discord отправителя: ${message.member.displayName || message.member.user.tag} [${message.author.id}]\n_____\n${description}`, idLabels: ['5cbc573c91d0c2ddc5a8f953'] }, '5cbc574a34ba2e8701f64359', (error, trelloCard) => {
                                        if (error) return message.reply(`произошла ошибка при добавлении отчёта в баг-трекер.`);
                                        server.query(`INSERT INTO \`trello\` (\`card\`, \`author\`, \`description\`) VALUES ('${trelloCard.id}', '${message.author.id}', '${description}')`, (error) => {
                                            if (error) return message.reply(`произошла ошибка запроса к базе данных, повторите попытку позже.`);
                                            const embed = new Discord.RichEmbed().setDescription(`${description}`);
                                            message.reply(`\`вы отправили отчёт об ошибке #${+answer[0]["AUTO_INCREMENT"]} в баг-трекер.\``, embed);
                                        });
                                    });
                                });
                            }).catch(() => {
                                ask_before.delete();
                            });
                        }).catch(() => {
                            ask_after.delete();
                        });
                    }).catch(() => {
                        ask_steps.delete();
                    });
                }).catch(() => {
                    ask_url.delete();
                });
            }).catch(() => {
                ask_name.delete();
            });
        }).catch(() => {
            ask_date.delete();
        });
    }

    if (message.content.startsWith('/add')){
        message.delete();
        if (!user["upload_images"]) return message.reply(`недостаточно прав доступа!`);
        const args = message.content.slice('/add').split(/ +/);
        if (!args[1] || !args[2]) return message.reply(`укажите номер ошибки и ссылку. /add [номер] [url]`);
        server.query(`SELECT * FROM \`trello\` WHERE \`id\` = '${args[1]}'`, (error, answer) => {
            if (error) return message.reply(`произошла ошибка базы данных, сообщите администратору.`);
            if (answer.size == 0) return message.reply(`баг-отчёт не найден. введите номер правильно.`);
            trello.addAttachmentToCard(`${answer[0].card}`, `${args[2]}`, (error) => {
                if (error) return message.reply(`произошла ошибка при добавлении доказательств.`);
                const embed = new Discord.RichEmbed().setDescription(`[${args[2]}](${args[2]})`)
                message.reply(`\`вы успешно прикрепили доказательства к карточке #${args[1]} в баг-трекере.\``, embed);
            });
        });
    }

    if (message.content.startsWith('/важно')){
        message.delete();
        if (!user["add-impotatnt-cards"]) return message.reply(`недостаточно прав доступа!`);
        const description = message.content.split('/важно ')[1];
        if (!description) return message.reply(`введите описание ошибки. ошибка будет передана разработчикам arizona rp`);
        if (description.length < 7) return message.reply(`описание должно быть ясным и понятным для его отправки`);
        server.query(`SELECT \`AUTO_INCREMENT\` FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'trello'`, (err, answer) => {
            if (err) return message.reply(`произошла ошибка базы данных, повторите попытку позже.`);
            trello.addCardWithExtraParams(`Баг-репорт №${+answer[0]["AUTO_INCREMENT"]}`, { desc: `Discord отправителя: ${message.member.displayName || message.member.user.tag} [${message.author.id}]\n_____\n${description}`, idLabels: ['5cbc573c91d0c2ddc5a8f953', '5cbc573c91d0c2ddc5a8f956'] }, '5cfe153d6f94920e681fa9a2', (error, trelloCard) => {
                if (error) return message.reply(`произошла ошибка при добавлении отчёта в баг-трекер.`);
                server.query(`INSERT INTO \`trello\` (\`card\`, \`author\`, \`description\`, \`status\`) VALUES ('${trelloCard.id}', '${message.author.id}', '${description}', '1')`, (error) => {
                    if (error) return message.reply(`произошла ошибка запроса к базе данных, повторите попытку позже.`);
                    const embed = new Discord.RichEmbed().setDescription(`${description}`).setColor('#FF0000');
                    message.reply(`\`вы отправили срочный отчёт об ошибке #${+answer[0]["AUTO_INCREMENT"]} в баг-трекер.\``, embed);
                });
            });
        });
    }

    if (message.content.startsWith('/status')){
        message.delete();
        if (!user["change_status"]) return message.reply(`недостаточно прав доступа!`);
        const args = message.content.slice('/status').split(/ +/);
        if (!args[1] || !args[2]) return message.reply(`укажите номер ошибки и статус. /status [номер] [статус (1 - важно, 0 - баг)]`);
        if (args[2] != '0' && args[2] != '1') return message.reply(`укажите номер ошибки и статус. /status [номер] [статус (1 - важно, 0 - баг)]`);
        server.query(`SELECT * FROM \`trello\` WHERE \`id\` = '${args[1]}'`, (error, answer) => {
            if (error) return message.reply(`произошла ошибка базы данных, сообщите администратору.`);
            if (answer.size == 0) return message.reply(`баг-отчёт не найден. введите номер правильно.`);
            if (+answer[0].status == +args[2]) return message.reply(`нельзя изменить статус с ${answer[0].status} на ${args[2]}`);
            if (args[2] == '0'){
                trello.deleteLabelFromCard(`${answer[0].card}`, '5cbc573c91d0c2ddc5a8f956', (error) => {
                    if (error) return message.reply(`произошла ошибка при снятии статуса важно.`);
                    trello.updateCardList(`${answer[0].card}`, '5cbc574a34ba2e8701f64359', (error) => {
                        if (error) return message.reply(`произошла ошибка при снятии статуса важно, невозможно переместить карточку.`);
                        server.query(`UPDATE \`trello\` SET \`status\` = '${args[2]}' WHERE \`id\` = '${args[1]}'`, (error) => {
                            if (error) return message.reply(`произошла ошибка бд при снятии статуса важно.`);
                            message.reply(`\`вы успешно сняли статус 'Важно' карточке #${args[1]} в баг-трекере.\``);
                        });
                    });
                });
            }else if (args[2] == '1'){
                trello.addLabelToCard(`${answer[0].card}`, '5cbc573c91d0c2ddc5a8f956', (error) => {
                    if (error) return message.reply(`произошла ошибка при установке статуса важно.`);
                    trello.updateCardList(`${answer[0].card}`, '5cfe153d6f94920e681fa9a2', (error) => {
                        if (error) return message.reply(`произошла ошибка при установке статуса важно, невозможно переместить карточку.`);
                        server.query(`UPDATE \`trello\` SET \`status\` = '${args[2]}' WHERE \`id\` = '${args[1]}'`, (error) => {
                            if (error) return message.reply(`произошла ошибка бд при установке статуса важно.`);
                            message.reply(`\`вы успешно установили статус 'Важно' карточке #${args[1]} в баг-трекере.\``);
                        });
                    });
                });
            }
        });
    }

    if (message.content.startsWith('/delete')){
        message.delete();
        if (!user["delete-cards"] && !user["archive-cards"]) return message.reply(`недостаточно прав доступа!`);
        const args = message.content.slice('/delete').split(/ +/);
        if (!args[1]) return message.reply(`укажите номер баг-репорта. /delete [номер]`);
        server.query(`SELECT * FROM \`trello\` WHERE \`id\` = '${args[1]}'`, (error, answer) => {
            if (error) return message.reply(`произошла ошибка базы данных, сообщите администратору.`);
            if (answer.size == 0) return message.reply(`баг-отчёт не найден. введите номер правильно.`);
            if (user["delete-cards"]){
                trello.deleteCard(`${answer[0].card}`, (error) => {
                    if (error) return message.reply(`произошла ошибка при удалении карточки.`);
                    message.reply(`\`вы успешно удалили карточку #${args[1]} в баг-трекере.\``);
                });
            }else{
                trello.updateCardList(`${answer[0].card}`, '5cbc5d6954567c1211a92d45', (error) => {
                    if (error) return message.reply(`произошла ошибка при удалении карточки.`);
                    message.reply(`\`вы успешно удалили карточку #${args[1]} в баг-трекере.\``);
                });
            }
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