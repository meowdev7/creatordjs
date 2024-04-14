const { Client, GatewayIntentBits, Partials, ActivityType } = require('discord.js');
const mongoose = require('mongoose');
const chalk = require('chalk');
const { table } = require('table');
const fs = require('fs');
const path = require('path');
const { errorHandler } = require('./base/functions/errorHandler');
const preSlashCmds = require('./base/components/preSlashCmds');
const preMsgCmds = require('./base/components/preMessageCmds');
const packageJson = require('./package.json');

let prefix;
let client;

let slashCommands = new Map();
let messageCommands = new Map();
let preMessageCmds = new Map();
let preSlsCmds = new Map();

let ownerIds = [];

let customStatus = null;
let customStatusActivity = null;
let customStatusType = null;
let customStatusUrl = null;

let slashType = "default";

module.exports = {
    init: function (token, commandPrefix) {
        prefix = commandPrefix || '!';
        client = new Client({
            intents: Object.keys(GatewayIntentBits),
            partials: Object.keys(Partials)
        });

        client.once('ready', () => {
            console.log(chalk.hex('#7289DA')(`[CreatorDJS v${packageJson.version}]`) + ' 🔓 Bot is now ready');
            console.log(chalk.hex('#7289DA')(`[CreatorDJS v${packageJson.version}]`) + ` 🟢 Prefix set to: ${prefix}`);
            console.log(chalk.hex('#7289DA')(`[CreatorDJS v${packageJson.version}]`) + ` 🤖 Logged in as ${client.user.tag}`);
            console.log(chalk.hex('#7289DA')(`[CreatorDJS v${packageJson.version}]`) + ' 🚀 Made by MeowDev7');
            console.log(chalk.hex('#7289DA')(`[CreatorDJS v${packageJson.version}]`) + ' 🔗  https://dsc.gg/mdlab');

            if (!customStatus) {
                client.user.setPresence({ activities: [{ name: `Running on CreatorDJS v${packageJson.version}`, type: ActivityType.Streaming }] });
            } else {
                client.user.setPresence({ status: `${customStatus}` });
                client.user.setActivity({
                    name: customStatusActivity,
                    type: customStatusType,
                    url: customStatusUrl
                })
            }

        });

        client.login(token);

        return client;
    },

    slash: function (commands) {
        if (!client) {
            console.error(chalk.hex('#ff0000')(`[CreatorDJS v${packageJson.version}]`) + ' ❌ Error: Bot client not initialized.');
            return;
        }

        client.once('ready', () => {
            registerSlashCommands(client, commands);
            showSlashCommandTable(commands, 'Slash Commands', '#7289DA'); // Discord Blue
        });

        client.on('interactionCreate', async interaction => {
            if (!interaction.isCommand()) return;
            const command = slashCommands.get(interaction.commandName);
            if (!command) return;
            if (command.dev && !ownerIds.includes(interaction.user.id)) {
                await interaction.reply({ content: 'This command is restricted to bot developers only.', ephemeral: true });
                return;
            }
            // Check if the user has the necessary permissions
            if (command.userPermissions && !interaction.member.permissions.has(command.userPermissions)) {
                return interaction.reply('You do not have the necessary permissions to use this command.');
            }

            // Check if the bot has the necessary permissions
            if (command.botPermissions) {
                interaction.guild.members.fetch(client.user)
                    .then(botMember => {
                        if (!botMember.permissions.has(command.botPermissions)) {
                            return interaction.reply('I do not have the necessary permissions to execute this command.');
                        } else {
                            // Proceed with executing the command
                            if (!checkCooldown(interaction, command)) return;
                            try {
                                command.execute(interaction);
                            } catch (error) {
                                console.error(chalk.hex('#ff0000')(`[CreatorDJS v${packageJson.version}]`) + ' ❌ Error executing command:', error);
                                interaction.reply('There was an error executing this command.');
                            }
                        }
                    })
                    .catch(console.error);

                return; // Exit the function to prevent further execution
            }

            if (!checkCooldown(interaction, command)) return;
            try {
                await command.execute(interaction, client);
            } catch (error) {
                console.error(chalk.hex('#ff0000')(`[CreatorDJS v${packageJson.version}]`) + ' ❌ Error executing command:', error);
                await interaction.reply({ content: 'An error occurred while executing this command.', ephemeral: true });
            }
        });
    },

    message: function (commands) {
        if (!client) {
            console.error(chalk.hex('#ff0000')(`[CreatorDJS v${packageJson.version}]`) + ' ❌ Error: Bot client not initialized.');
            return;
        }

        // Register message commands
        commands.forEach(command => {
            messageCommands.set(command.name, command);
        });

        client.on('messageCreate', message => {
            if (!message.guild || !message.content.startsWith(prefix) || message.author.bot) return;
            const args = message.content.slice(prefix.length).trim().split(/ +/);
            const commandName = args.shift().toLowerCase();
            const command = messageCommands.get(commandName);
            if (!command) return;

            if (command.ownerOnly && !ownerIds.includes(message.author.id)) {
                return message.reply('This command is restricted to bot owners only.');
            }

            // Check if the user has the necessary permissions
            if (command.userPermissions && !message.member.permissions.has(command.userPermissions)) {
                return message.reply('You do not have the necessary permissions to use this command.');
            }

            // Check if the bot has the necessary permissions
            if (command.botPermissions) {
                message.guild.members.fetch(client.user)
                    .then(botMember => {
                        if (!botMember.permissions.has(command.botPermissions)) {
                            return message.reply('I do not have the necessary permissions to execute this command.');
                        } else {
                            // Proceed with executing the command
                            if (!checkCooldown(message, command)) return;
                            try {
                                command.execute(message, args);
                            } catch (error) {
                                console.error(chalk.hex('#ff0000')(`[CreatorDJS v${packageJson.version}]`) + ' ❌ Error executing command:', error);
                                message.reply('There was an error executing this command.');
                            }
                        }
                    })
                    .catch(console.error);

                return; // Exit the function to prevent further execution
            }

            if (!checkCooldown(message, command)) return;

            try {
                command.execute(message, args, client);
            } catch (error) {
                console.error(chalk.hex('#ff0000')(`[CreatorDJS v${packageJson.version}]`) + ' ❌ Error executing command:', error);
                message.reply('There was an error executing this command.');
            }
        });

        // Show table for message commands
        showCommandTable(commands, 'Message (Prefix) Commands', '#7289DA'); // Discord Blue
    },


    event: function (events) {
        if (!client) {
            console.error(chalk.hex('#ff0000')(`[CreatorDJS v${packageJson.version}]`) + ' ❌ Error: Bot client not initialized.');
            return;
        }

        events.forEach(event => {
            const { name, execute } = event;
            client.on(name, execute.bind(null, client));
        });
    },

    load: function (directory) {
        const commands = [];
    
        const readDirectory = (dir) => {
            const files = fs.readdirSync(dir);
            for (const file of files) {
                const filePath = path.join(dir, file);
                const stat = fs.statSync(filePath);
                if (stat.isDirectory()) {
                    readDirectory(filePath); // Recursively read subdirectories
                } else if (file.endsWith('.js')) {
                    const command = require(filePath);
                    commands.push(command);
                }
            }
        };
    
        readDirectory(directory);
    
        return commands;
    },
    

    setDevs: function (ids) {
        ownerIds = ids;
    },

    database: function (mongooseUrl) {
        mongoose.connect(mongooseUrl);
        const db = mongoose.connection;
        db.on('error', console.error.bind(console, chalk.hex('#ff0000')(`[CreatorDJS v${packageJson.version}]`) + ' ❌ Database connection error:'));
        db.once('open', () => {
            console.log(chalk.hex('#7289DA')(`[CreatorDJS v${packageJson.version}]`) + ' 🔌 Connected to database');
        });
    },

    getClient: function () {
        return client;
    },

    setActivity: function (status, activity, type, url) {
        if (!client) {
            console.error(chalk.hex('#ff0000')(`[CreatorDJS v${packageJson.version}]`) + ' ❌ Error: Bot client not initialized.');
            return;
        }

        customStatus = status;
        customStatusActivity = activity;
        customStatusType = type;
        customStatusUrl = url;

        console.log(chalk.hex('#7289DA')(`[CreatorDJS v${packageJson.version}]`) + ` 🎮 Custom activity set: ${activity}`);
    },
    setSlash: function (type) {
        if (type === "builder") {
            slashType = "builder";
        }
        else if (type === "default") {
            slashType = "default";
        }
        else {
            slashType = "default";
        }
    },
    preCmds: function(type) {
        if (type === "slash")
        {
            preSlashCmds(preSlsCmds, client)
        }
        else if (type === "message") {
            preMsgCmds(preMessageCmds, client, prefix)
        }
        else if (type === "both") {
            preSlashCmds(preSlsCmds, client)
            preMsgCmds(preMessageCmds, client, prefix)
        }
        else {
            console.error(chalk.hex('#ff0000')(`[CreatorDJS v${packageJson.version}]`) + `❌ PreCmds not loaded as valid options are preCmds('slash' or 'message' or 'both')`);
        }
    }
};

// Inside the `registerSlashCommands` function

function registerSlashCommands(client, commands) {
    if (!client.application?.commands) {
        console.error(chalk.hex('#ff0000')(`[CreatorDJS v${packageJson.version}]`) + ' ❌ Error: Bot application not initialized.');
        return;
    }
    if (slashType === "default") {
        client.application.commands.set(commands);
        commands.forEach(command => {
            if (!command.name) {
                console.error(chalk.hex('#ff0000')(`[CreatorDJS v${packageJson.version}]`) + `❌ Error: Invalid command format ${command}`)
                console.log(chalk.hex('#ff0000')(`[CreatorDJS v${packageJson.version}]`) + `⚠️ Warning: If you are using slashCommandBuilder commands, in your code add creatordjs.setSlash("builder")`)
            }
            slashCommands.set(command.name, command);
        });

    }
    if (slashType === "builder") {
        // Register each slash command
        commands.forEach(command => {
            if (!command.data || typeof command.data !== 'object') {
                console.error(chalk.hex('#ff0000')(`[CreatorDJS v${packageJson.version}]`) + `❌ Error: Invalid command format ${command}`)
                console.log(chalk.hex('#ff0000')(`[CreatorDJS v${packageJson.version}]`) + `⚠️ Warning: If you are using normal slash commands, in your code add creatordjs.setSlash("default")`)
                return;
            }

            // Convert the command data to JSON if necessary
            const commandData = typeof command.data.toJSON === 'function' ? command.data.toJSON() : command.data;

            client.application.commands.create(commandData)
                .then(() => {
                   slashCommands.set(commandData.name, command);
                })
                .catch(error => {
                    console.error(chalk.hex('#ff0000')(`[CreatorDJS v${packageJson.version}]`) +`Error registering slash command '${commandData.name}':`, error);
                });
        });
    }
}



function showCommandTable(commands, type, color) {
    const data = [['Command', 'Description']];
    commands.forEach(command => {
        data.push([command.name, command.description]);
    });
    const output = table(data);
    console.log(chalk.hex(color)(`\n[CreatorDJS v${packageJson.version}]`) + ` 💼 Registered ${type}:`);
    console.log(output);
}
function showSlashCommandTable(commands, type, color) {
    const data = [['Command', 'Description']];
    if (slashType === "default") { // Use === for comparison instead of =
        commands.forEach(command => {
            data.push([command.name, command.description]);
        });    
    } else if (slashType === "builder") { // Use === for comparison instead of =
        commands.forEach(commandData => {
            if (commandData.data && commandData.data.name && commandData.data.description) {
                data.push([commandData.data.name, commandData.data.description]);
            } else {
                console.error('Invalid command format:', commandData);
            }
        });
    }
    const output = table(data);
    console.log(chalk.hex(color)(`\n[CreatorDJS v${packageJson.version}]`) + ` 💼 Registered ${type}:`);
    console.log(output);
}



 
    function checkCooldown(interactionOrMessage, command) {
    if (!command.cooldown) return true;

    // Ensure that the command object has a cooldowns map
    if (!command.cooldowns) {
        command.cooldowns = new Map();
    }

    const { cooldowns } = command;
    const now = Date.now();
    const cooldownAmount = command.cooldown * 1000;

    let authorId;

    // Check if interactionOrMessage is an interaction object
    if (interactionOrMessage.user?.id) {
        authorId = interactionOrMessage.user?.id;
    } else {
        authorId = interactionOrMessage.author?.id;
    }

    if (!authorId) {
        console.error('Unable to retrieve author ID.');
        return false;
    }

    if (cooldowns.has(authorId)) {
        const expirationTime = cooldowns.get(authorId) + cooldownAmount;
        if (now < expirationTime) {
            const timeLeft = (expirationTime - now) / 1000;
            interactionOrMessage.reply(`Please wait ${timeLeft.toFixed(1)} more seconds before reusing the \`${command.name}\` command.`);
            return false;
        }
    }

    cooldowns.set(authorId, now);
    setTimeout(() => cooldowns.delete(authorId), cooldownAmount);

    return true;
}
