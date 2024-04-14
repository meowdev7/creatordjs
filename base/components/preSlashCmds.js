const fs = require('fs');
const path = require('path');
const { table } = require('table');
const gradient = require('gradient-string');
const { version } = require('../../package.json');
const chalk = require('chalk');
const errorHandler = require('../functions/errorHandler');

function preSlashCmds(preSlsCmds, client) {
    // Read all files in the Commands directory
    client.once('ready', () => {
        const commandsDirectory = path.join(__dirname, '..', 'slashCommands'); // Path to the Commands folder
        try {
            // Read all files in the Commands directory
        fs.readdir(commandsDirectory, (err, files) => {
            if (err) {
                console.error(chalk.hex('#ff0000')(`[creatordjs v${version}]`) + ' ❌ Error: Prebuilt slashCommands were not loaded.' + err);
                return;
            }

            // Filter out only JavaScript files
            const jsFiles = files.filter(file => file.endsWith('.js'));

            // Load each command file
            jsFiles.forEach(file => {
                const commandPath = path.join(commandsDirectory, file);
                const command = require(commandPath);
                if (command.data && typeof command.data === 'object') {
                    // Convert the command data to JSON if necessary
                    const commandData = typeof command.data.toJSON === 'function' ? command.data.toJSON() : command.data;
                    // Register the slash command with Discord
                    client.application.commands.create(commandData)
                        .then(() => {
                            preSlsCmds.set(commandData.name, command);
                        })
                        .catch(error => {
                            console.error(chalk.hex('#ff0000')(`[creatordjs v${version}]`) + `Error registering slash command '${commandData.name}':`, error);
                        });
                        preSlsCmds.set(commandData.name, command);
                } else {
                    console.error(chalk.hex('#ff0000')(`[creatordjs v${version}]`) + `❌ Error: Code 706`);
                }
            });

            // Generate table data
            const data = [['Command', 'Description']];
            preSlsCmds.forEach(command => {
                data.push([command.data.name, command.data.description || 'N/A']);
            });

            // Convert data to table
            const output = table(data);

            // Log table to console with gradient color
            console.log(chalk.hex('#0099ff')(`[creatordjs v${version}]`) + (`\n\n[creatordjs v${version}]`) + ' ✅ Prebuilt slashCommands are loaded.');
            console.log(gradient(['red', 'green'])(output));
        });
        } catch (error) {
            errorHandler(error)
        }
        
    });


    client.on('interactionCreate', async interaction => {
        try {
            if (!interaction.isCommand()) return;
        const command = preSlsCmds.get(interaction.commandName);
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
                            console.error(chalk.hex('#ff0000')(`[creatordjs v${version}]`) + ' ❌ Error executing command:', error);
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
            console.error(chalk.hex('#ff0000')(`[creatordjs v${version}]`) + ' ❌ Error executing command:', error);
            await interaction.reply({ content: 'An error occurred while executing this command.', ephemeral: true });
        }
        } catch (error) {
            errorHandler(error)
        }
        
    });
}

module.exports = preSlashCmds;

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