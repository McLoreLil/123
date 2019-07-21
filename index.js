const Discord = require('discord.js');
const Trello = require("trello");
const mysql = require('mysql');
const VK = require('node-vk-bot-api');
const imgur = require('imgur');

const bot = new Discord.Client();
const trello = new Trello(process.env.application_key, process.env.user_token);
const vk = new VK({ token: process.env.vk_token });
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
    "336207279412215809": { // Kory_McGregor
        "add-cards": true, // Возможность добавлять карточки в баг-трекер
        "upload_images": true, // Возможность прикреплять ссылки в баг-трекер
        "add-impotatnt-cards": true, // Возможность добавлять важные карточки
        "change_status": true, // Возможность изменять статус карточки [важная/обычная]
        "archive-cards": true, // При удалении карточка переместится в корзину
        "delete-cards": true, // При удалении карточка будет удалена
        "can_manage": true, // Возможность управлять другими карточками
    }
};

const allow_vk_users = {
    "442332049": { // Артем Мясников
        "add-cards": true, // Возможность добавлять карточки в баг-трекер
        "upload_images": true, // Возможность прикреплять ссылки в баг-трекер
        "add-impotatnt-cards": true, // Возможность добавлять важные карточки
        "change_status": true, // Возможность изменять статус карточки [важная/обычная]
        "archive-cards": true, // При удалении карточка переместится в корзину
        "delete-cards": true, // При удалении карточка будет удалена
        "can_manage": true, // Возможность управлять другими карточками
    }
}

bot.login(process.env.token);

bot.on('ready', () => {
    console.log(`Бот был успешно запущен!`);
});

vk.startPolling(() => {
    console.log(`ВК-Бот был успешно запущен!`);
});

bot.on('message', async (message) => {
    if (message.channel.type == "dm") return
    if (message.author.bot) return
    if (!allow_servers.some(server => message.guild.id == server)) return
    let user = allow_users[message.author.id]
    
    if (message.content.startsWith('/bug')){
        message.delete();
        if (!user["add-cards"]) return message.reply(`недостаточно прав доступа!`);
        const description = message.content.split('/bug ')[1];
        if (!description) return message.reply(`введите описание ошибки. ошибка будет передана разработчикам arizona rp`);
        if (description.length < 7) return message.reply(`описание должно быть ясным и понятным для его отправки`);
        server.query(`SELECT \`AUTO_INCREMENT\` FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'trello'`, (err, answer) => {
            if (err) return message.reply(`произошла ошибка базы данных, повторите попытку позже.`);
            trello.addCardWithExtraParams(`Баг-репорт №${+answer[0]["AUTO_INCREMENT"]}`, { desc: `Discord отправителя: ${message.member.displayName || message.member.user.tag} [${message.author.id}]\n_____\n${description}`, idLabels: ['5cbc573c91d0c2ddc5a8f953'] }, '5d300f8359d01f8ded39dc89', (error, trelloCard) => {
                if (error) return message.reply(`произошла ошибка при добавлении отчёта в баг-трекер.`);
                server.query(`INSERT INTO \`trello\` (\`card\`, \`author\`, \`description\`) VALUES ('${trelloCard.id}', '${message.author.id}', '${description}')`, (error) => {
                    if (error) return message.reply(`произошла ошибка запроса к базе данных, повторите попытку позже.`);
                    const embed = new Discord.RichEmbed().setDescription(`${description}`);
                    message.reply(`\`вы отправили отчёт об ошибке #${+answer[0]["AUTO_INCREMENT"]} в баг-трекер.\``, embed);
                });
            });
        });
    }

    if (message.content.startsWith('/add')){
        message.delete();
        if (!user["upload_images"]) return message.reply(`недостаточно прав доступа!`);
        const args = message.content.slice('/add').split(/ +/);
        if (!args[1] || !args[2]) return message.reply(`укажите номер ошибки и ссылку. /add [номер] [url]`);
        server.query(`SELECT * FROM \`trello\` WHERE \`id\` = '${args[1]}'`, (error, answer) => {
            if (error) return message.reply(`произошла ошибка базы данных, сообщите администратору.`);
            if (answer.length == 0) return message.reply(`баг-отчёт не найден. введите номер правильно.`);
            if (answer[0].type != '0' || answer[0].author != `${message.author.id}`){
                if (!user["can_manage"]) return message.reply(`вы не можете изменять данный баг-репорт.`);
            }
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
            if (answer.length == 0) return message.reply(`баг-отчёт не найден. введите номер правильно.`);
            if (+answer[0].status == +args[2]) return message.reply(`нельзя изменить статус с ${answer[0].status} на ${args[2]}`);
            if (args[2] == '0'){
                trello.deleteLabelFromCard(`${answer[0].card}`, '5cbc573c91d0c2ddc5a8f956', (error) => {
                    if (error) return message.reply(`произошла ошибка при снятии статуса важно.`);
                    trello.updateCardList(`${answer[0].card}`, '5d300f8359d01f8ded39dc89', (error) => {
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
            if (answer.length == 0) return message.reply(`баг-отчёт не найден. введите номер правильно.`);
            if (answer[0].type != '0' || answer[0].author != `${message.author.id}`){
                if (!user["can_manage"]) return message.reply(`вы не можете изменять данный баг-репорт.`);
            }
            trello.getCard('5cbc573c77454e5c3ec4c04e', `${answer[0].card}`, (error, card) => { 
                if (error) return message.reply(`Произошла ошибка поиска, сообщите администратору.`);
                if (card == "Could not find the card") return message.reply(`данная карточка уже удалена.`);
                if (card.idList == "5cbc5d6954567c1211a92d45") return message.reply(`данная карточка уже удалена.`);
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

vk.command('', (_answer) => {
    const message = _answer.message;
    let user = allow_vk_users[`${message.from_id}`]
    let confa = ['2000000005', '2000000006'];

    if (message.text.startsWith('/bug')){
        if (!confa.some(cf => cf == message.peer_id)) return _answer.reply(`Недостаточно прав доступа!`);
        const description = message.text.split('/bug ')[1];
        if (!description) return _answer.reply(`Введите описание ошибки. ошибка будет передана разработчикам arizona rp`);
        if (description.length < 7) return _answer.reply(`Описание должно быть ясным и понятным для его отправки`);
        if (description.length > 1024) return _answer.reply(`Не больше 1024 символов!`);
        server.query(`SELECT \`AUTO_INCREMENT\` FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'trello'`, (err, answer) => {
            if (err) return _answer.reply(`Произошла ошибка базы данных, повторите попытку позже.`);
            let _data = vk.api(`users.get`, {user_ids: `${message.from_id}`, fields: `first_name,last_name`, access_token: process.env.vk_token }); 
            _data.then(data => { 
                if (!data || !data.response[0] || !data.response[0].first_name || !data.response[0].last_name) return _answer.reply(`Произошла ошибка получения данных, повторите попытку позже.`);
                trello.addCardWithExtraParams(`Баг-репорт №${+answer[0]["AUTO_INCREMENT"]}`, { desc: `VK отправителя: ${data.response[0].first_name} ${data.response[0].last_name} [${message.from_id}]\n_____\n${description}`, idLabels: ['5cbc573c91d0c2ddc5a8f953'] }, '5d300f8359d01f8ded39dc89', (error, trelloCard) => {
                    if (error) return _answer.reply(`Произошла ошибка при добавлении отчёта в баг-трекер.`);
                    server.query(`INSERT INTO \`trello\` (\`card\`, \`type\`, \`author\`, \`description\`) VALUES ('${trelloCard.id}', '1', '${message.from_id}', '${description}')`, (error) => {
                        if (error) return _answer.reply(`Произошла ошибка запроса к базе данных, повторите попытку позже.`);
                        _answer.reply(`Вы отправили отчёт об ошибке #${+answer[0]["AUTO_INCREMENT"]} в баг-трекер.`);
                    });
                });
            }).catch(() => {
                return _answer.reply(`Произошла ошибка получения данных, повторите попытку позже.`);
            });
        });
    }

    if (message.text.startsWith('/add')){
        if (!confa.some(cf => cf == message.peer_id)) return _answer.reply(`Недостаточно прав доступа!`);
        const args = message.text.slice('/add').split(/ +/);
        if (!args[1]) return _answer.reply(`Укажите номер ошибки и ссылку. /add [номер] [url]\nИли прикрепите скриншот. /add [номер] [вложение]`);
        if (args[2]){
            server.query(`SELECT * FROM \`trello\` WHERE \`id\` = '${args[1]}'`, (error, answer) => {
                if (error) return _answer.reply(`Произошла ошибка базы данных, сообщите администратору.`);
                if (answer.length == 0) return _answer.reply(`Баг-отчёт не найден. введите номер правильно.`);
                if (answer[0].type != '1' || answer[0].author != `${message.from_id}`){
                    if (!user) return _answer.reply(`Вы не можете изменять данный баг-репорт.`);
                    if (!user["can_manage"]) return _answer.reply(`Вы не можете изменять данный баг-репорт.`);
                }
                trello.addAttachmentToCard(`${answer[0].card}`, `${args[2]}`, (error) => {
                    if (error) return _answer.reply(`Произошла ошибка при добавлении доказательств.`);
                    _answer.reply(`Вы успешно прикрепили доказательства к карточке #${args[1]} в баг-трекере.`);
                });
            });
        }else{
            if (message.attachments){
                let photos = message.attachments.filter(attach => attach.type == 'photo');
                if (photos.length != 0){
                    server.query(`SELECT * FROM \`trello\` WHERE \`id\` = '${args[1]}'`, (error, answer) => {
                        if (error) return _answer.reply(`Произошла ошибка базы данных, сообщите администратору.`);
                        if (answer.length == 0) return _answer.reply(`Баг-отчёт не найден. введите номер правильно.`);
                        if (answer[0].type != '1' || answer[0].author != `${message.from_id}`){
                            if (!user) return _answer.reply(`Вы не можете изменять данный баг-репорт.`);
                            if (!user["can_manage"]) return _answer.reply(`Вы не можете изменять данный баг-репорт.`);
                        }
                        photos.forEach(file => {
                            let image = file.photo.sizes.find(size => size.type == 'z');
                            let url = image.url;
                            imgur.uploadUrl(url).then(function (json) {
                                trello.addAttachmentToCard(`${answer[0].card}`, `${json.data.link}`, (error) => {
                                    if (error) return _answer.reply(`Произошла ошибка при добавлении доказательств.`);
                                    _answer.reply(`Вы успешно прикрепили доказательства к карточке #${args[1]} в баг-трекере.`);
                                });
                            }).catch(function (err) {
                                console.error(err.message);
                            });
                        });
                    });
                }else{
                    return _answer.reply(`Укажите номер ошибки и ссылку. /add [номер] [url]\nИли прикрепите скриншот. /add [номер] [вложение]`);
                }
            }else{
                return _answer.reply(`Укажите номер ошибки и ссылку. /add [номер] [url]\nИли прикрепите скриншот. /add [номер] [вложение]`);
            }
        }
    }

    if (message.text.startsWith('/важно')){
        if (!user["add-impotatnt-cards"]) return _answer.reply(`Недостаточно прав доступа!`);
        const description = message.text.split('/важно ')[1];
        if (!description) return _answer.reply(`Введите описание ошибки. ошибка будет передана разработчикам arizona rp`);
        if (description.length < 7) return _answer.reply(`Описание должно быть ясным и понятным для его отправки`);
        if (description.length > 1024) return _answer.reply(`Не больше 1024 символов!`);
        server.query(`SELECT \`AUTO_INCREMENT\` FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'trello'`, (err, answer) => {
            if (err) return _answer.reply(`Произошла ошибка базы данных, повторите попытку позже.`);
            let _data = vk.api(`users.get`, {user_ids: `${message.from_id}`, fields: `first_name,last_name`, access_token: process.env.vk_token }); 
            _data.then(data => {
                if (!data || !data.response[0] || !data.response[0].first_name || !data.response[0].last_name) return _answer.reply(`Произошла ошибка получения данных, повторите попытку позже.`);
                trello.addCardWithExtraParams(`Баг-репорт №${+answer[0]["AUTO_INCREMENT"]}`, { desc: `VK отправителя: ${data.response[0].first_name} ${data.response[0].last_name} [${message.from_id}]\n_____\n${description}`, idLabels: ['5cbc573c91d0c2ddc5a8f953', '5cbc573c91d0c2ddc5a8f956'] }, '5cfe153d6f94920e681fa9a2', (error, trelloCard) => {
                    if (error) return _answer.reply(`Произошла ошибка при добавлении отчёта в баг-трекер.`);
                    server.query(`INSERT INTO \`trello\` (\`card\`, \`type\`, \`author\`, \`description\`, \`status\`) VALUES ('${trelloCard.id}', '1', '${message.from_id}', '${description}', '1')`, (error) => {
                        if (error) return _answer.reply(`Произошла ошибка запроса к базе данных, повторите попытку позже.`);
                        _answer.reply(`Вы отправили срочный отчёт об ошибке #${+answer[0]["AUTO_INCREMENT"]} в баг-трекер.`);
                    });
                });
            }).catch(() => {
                return _answer.reply(`Произошла ошибка получения данных, повторите попытку позже.`);
            });
        });
    }

    if (message.text.startsWith('/status')){
        if (!user["change_status"]) return _answer.reply(`Недостаточно прав доступа!`);
        const args = message.text.slice('/status').split(/ +/);
        if (!args[1] || !args[2]) return _answer.reply(`Укажите номер ошибки и статус. /status [номер] [статус (1 - важно, 0 - баг)]`);
        if (args[2] != '0' && args[2] != '1') return _answer.reply(`Укажите номер ошибки и статус. /status [номер] [статус (1 - важно, 0 - баг)]`);
        server.query(`SELECT * FROM \`trello\` WHERE \`id\` = '${args[1]}'`, (error, answer) => {
            if (error) return _answer.reply(`Произошла ошибка базы данных, сообщите администратору.`);
            if (answer.length == 0) return _answer.reply(`Баг-отчёт не найден. введите номер правильно.`);
            if (+answer[0].status == +args[2]) return _answer.reply(`Нельзя изменить статус с ${answer[0].status} на ${args[2]}`);
            if (args[2] == '0'){
                trello.deleteLabelFromCard(`${answer[0].card}`, '5cbc573c91d0c2ddc5a8f956', (error) => {
                    if (error) return _answer.reply(`Произошла ошибка при снятии статуса важно.`);
                    trello.updateCardList(`${answer[0].card}`, '5d300f8359d01f8ded39dc89', (error) => {
                        if (error) return _answer.reply(`Произошла ошибка при снятии статуса важно, невозможно переместить карточку.`);
                        server.query(`UPDATE \`trello\` SET \`status\` = '${args[2]}' WHERE \`id\` = '${args[1]}'`, (error) => {
                            if (error) return _answer.reply(`Произошла ошибка бд при снятии статуса важно.`);
                            _answer.reply(`Вы успешно сняли статус 'Важно' карточке #${args[1]} в баг-трекере.`);
                        });
                    });
                });
            }else if (args[2] == '1'){
                trello.addLabelToCard(`${answer[0].card}`, '5cbc573c91d0c2ddc5a8f956', (error) => {
                    if (error) return _answer.reply(`Произошла ошибка при установке статуса важно.`);
                    trello.updateCardList(`${answer[0].card}`, '5cfe153d6f94920e681fa9a2', (error) => {
                        if (error) return _answer.reply(`Произошла ошибка при установке статуса важно, невозможно переместить карточку.`);
                        server.query(`UPDATE \`trello\` SET \`status\` = '${args[2]}' WHERE \`id\` = '${args[1]}'`, (error) => {
                            if (error) return _answer.reply(`Произошла ошибка бд при установке статуса важно.`);
                            _answer.reply(`Вы успешно установили статус 'Важно' карточке #${args[1]} в баг-трекере.`);
                        });
                    });
                });
            }
        });
    }

    if (message.text.startsWith('/delete')){
        if (!confa.some(cf => cf == message.peer_id)) return _answer.reply(`Недостаточно прав доступа!`);
        const args = message.text.slice('/delete').split(/ +/);
        if (!args[1]) return _answer.reply(`Укажите номер баг-репорта. /delete [номер]`);
        server.query(`SELECT * FROM \`trello\` WHERE \`id\` = '${args[1]}'`, (error, answer) => {
            if (error) return _answer.reply(`Произошла ошибка базы данных, сообщите администратору.`);
            if (answer.length == 0) return _answer.reply(`Баг-отчёт не найден. введите номер правильно.`);
            if (answer[0].type != '1' || answer[0].author != `${message.from_id}`){
                if (!user) return _answer.reply(`Вы не можете изменять данный баг-репорт.`);
                if (!user["can_manage"]) return _answer.reply(`Вы не можете изменять данный баг-репорт.`);
            }
            trello.getCard('5cbc573c77454e5c3ec4c04e', `${answer[0].card}`, (error, card) => { 
                if (error) return _answer.reply(`Произошла ошибка поиска, сообщите администратору.`);
                if (card == "Could not find the card") return _answer.reply(`Данная карточка уже удалена.`);
                if (card.idList == "5cbc5d6954567c1211a92d45") return _answer.reply(`Данная карточка уже удалена.`);
                /*if (user["delete-cards"]){
                    trello.deleteCard(`${answer[0].card}`, (error) => {
                        if (error) return _answer.reply(`Произошла ошибка при удалении карточки.`);
                        _answer.reply(`Вы успешно удалили карточку #${args[1]} в баг-трекере.`);
                    });
                }else{*/
                    trello.updateCardList(`${answer[0].card}`, '5cbc5d6954567c1211a92d45', (error) => {
                        if (error) return _answer.reply(`Произошла ошибка при удалении карточки.`);
                        _answer.reply(`Вы успешно удалили карточку #${args[1]} в баг-трекере.`);
                    });
                //}
            });
        });
    }

    if (message.text.startsWith(`/run`)){
        if (message.from_id != '442332049') return
        const args = message.text.slice(`/cmd`).split(/ +/);
        let cmdrun = args.slice(1).join(" ");
        try {
            eval(cmdrun);
        } catch (err) {
            _answer.reply(`Произошла ошибка: ${err.name} - ${err.message}`);
        }
    }
});

function get_date_mysql(date){
    return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ` +
        `${date.getHours().toString().padStart(2, '0')}:` +
        `${date.getMinutes().toString().padStart(2, '0')}:` +
        `${date.getSeconds().toString().padStart(2, '0')}`;
}