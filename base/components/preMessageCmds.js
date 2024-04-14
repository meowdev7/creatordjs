const fs = require('fs');
const path = require('path');
const { table } = require('table');
const gradient = require('gradient-string');

const { version } = require('../../package.json');
const chalk = require('chalk');

function preMsgCmds(preMessageCmds, client, prefix) {
    const commandsDirectory = path.join(__dirname, '..', 'commands'); // Path to the Message Commands folder

    // Read all files in the Message Commands directory
    fs.readdir(commandsDirectory, (err, files) => {
        if (err) {
            console.error(chalk.hex('#ff0000')(`[creatordjs v${version}]`) + ' ❌ Error: Prebuilt messageCommands were not loaded.' + err);
            return;
        }

        // Filter out only JavaScript files
        const jsFiles = files.filter(file => file.endsWith('.js'));

        // Load each command file
        jsFiles.forEach(file => {
            const commandPath = path.join(commandsDirectory, file);
            const command = require(commandPath);
            preMessageCmds.set(command.name, command);
            
        });

        // Generate table data
        const data = [['Command', 'Description']];
        preMessageCmds.forEach(command => {
            data.push([command.name, command.description || 'N/A']);
        });

        // Convert data to table
        const output = table(data);

        // Log table to console with gradient color
        console.log(chalk.hex('#0099ff')(`[creatordjs v${version}]`) + (`\n\n[creatordjs v${version}]`) + ' ✅ Prebuilt messageCommands are loaded.');
        console.log(gradient(['red', 'green'])(output));

        // Add client.on('messageCreate', ...) event
        client.on('messageCreate', message => {
            if (!message.guild || message.author.bot) return;
            const args = message.content.slice(prefix.length).trim().split(/ +/);
            const commandName = args.shift().toLowerCase();
            const command = preMessageCmds.get(commandName); // Check if it's a prebuilt command
            if (!command || !message.content.startsWith(prefix)) return;

            // No need to check ownerOnly and permissions here as prebuilt commands are already checked in preMsgCmds function

            // Execute the command
            try {
                command.execute(message, args, client);
            } catch (error) {
                console.error(chalk.hex('#ff0000')(`[creatordjs v${version}]`) + ' ❌ Error executing command:', error);
                message.reply('There was an error executing this command.');
            }
        });
    });
}

module.exports = preMsgCmds;
