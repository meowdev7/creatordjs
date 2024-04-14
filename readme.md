# CreatorDJS
CreatorDJS is a Node.js package that simplifies the process of creating Discord bots using Discord.js v14. It provides easy-to-use methods for setting up and managing bot functionality, including slash commands, prefix commands, and database connections.
  
## Installation
You can install CreatorDJS via npm:
  
```bash 
npm install creatordjs
```
  
## Usage
Here's how you can use CreatorDJS to create a Discord bot:

```javascript 
const creatordjs = require('creatordjs');
require('dotenv').config();
 
// Initialize token and set prefix
const token = process.env.BOT_TOKEN;
const prefix = '!';
const client = creatordjs.init(token, prefix);
 
// Create slash commands
const slashCommands = [
//   Define slash commands here
];
creatordjs.slash(slashCommands);

// Create prefix commands
const prefixCommands = [
//   Define prefix commands here
];
creatordjs.message(prefixCommands);

// Connect to MongoDB database
const mongooseUrl = process.env.MONGOOSE_URL;
creatordjs.database(mongooseUrl);

// Set custom bot activity
creatordjs.setActivity('online', 'Meow', 1, 'https://youtube.com/@meowdev7');
```
  
## Command Template
#### Slash Commands - default
```javascript
{
    name: 'ping',
    description: 'Ping command',
    cooldown: 3,
    dev: false,
    options: [],
    botPermissions: ["SendMessages"],
    userPermissions: ["SendMessages"],
    async execute(interaction) {

    }
}
```
#### Slash Commands - builder
```javascript
{
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Ping the bot.'),
    cooldown: 3,
    dev: false,
    botPermissions: ["SendMessages"],
    userPermissions: ["SendMessages"],
    async execute(interaction) {

    }
} 
```
#### Message Commands
```javascript
{
    name: 'ping',
    description: 'Ping command',
    cooldown: 3,
    dev: false,
    botPermissions: ["SendMessages"],
    userPermissions: ["SendMessages"],
    async execute(message, args) {

    }
}
```
  
## Features
  - **Initializing the Bot:** Use `creatordjs.init(token, prefix)` to initialize your bot with your Discord bot token and command prefix.
  - **Registering Slash Commands:** Use `creatordjs.slash(commands)` to register slash commands for your bot.
  - **Registering Prefix Commands:** Use `creatordjs.message(commands)` to register prefix commands for your bot.
  - **Connecting to Database:** Use `creatordjs.database(mongooseUrl)` to connect your bot to a MongoDB database using Mongoose.
  - **Developer Restriction:** Restrict certain commands to bot developers for added security. Use `creatordjs.setDevs(["id1", "id2"])` to specify bot developer IDs.
  - **Permission Checks:** Check user and bot permissions before executing commands.
  - **Cooldown Management:** Manage command cooldowns to prevent spamming.
  - **Dynamic Command Loading:** Load commands dynamically from a specified directory. Use `creatordjs.load(directory)`.
  - **Event Handling:** Handle Discord events seamlessly with event listeners. Use `creatordjs.event(events)`.
  - **Slash Command Type:** Choose between two types of slash command registration: "default" or "builder". Use `creatordjs.setSlash(type)` to specify the type.
  - **Error Handling:** Integrated error handling with an `errorHandler` function.
  
## Prebuilt Commands

#### Slash Commands

Here are some prebuilt slash commands available for use:

- `ping`: Ping command to check bot latency.
- Add more slash commands as needed.

#### Message (Prefix) Commands

Here are some prebuilt message commands available for use:

- `ping`: Ping command to check bot latency.
- Add more message commands as needed.

## Tutorial

Check out the tutorial playlist.
[YouTube Playlist](https://www.youtube.com/playlist?list=PLoghmIxwCwEsobzw-a_hqt6NPLpIm_FXH)

## Support

For additional help and support, join our Discord server: [Meow Dev 7's Lab Discord Server](https://dsc.gg/mdlab)

## Suggestions

We welcome your suggestions and feedback! Feel free to post them on our Discord server.

## License

This project is licensed under the ISC License.

## Modules Used
- [chalk](https://www.npmjs.com/package/chalk) - For colored console output
- [discord.js](https://www.npmjs.com/package/discord.js) - Discord API library for Node.js
- [dotenv](https://www.npmjs.com/package/dotenv) - For loading environment variables
- [mongoose](https://www.npmjs.com/package/mongoose) - MongoDB object modeling tool designed to work in an asynchronous environment
- [table](https://www.npmjs.com/package/table) - For generating ASCII tables
