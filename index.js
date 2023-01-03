// The 'fs' module is Node's native file system module. 'fs' is used to read the 'commmands' directory and identify our command files.
// The 'path' module is Node's native path utility module. 'path' helps construct paths to access files and directories.
// One of the advantages of the 'path' module is that it automatically detects the operating system and uses the appropriate joiners.
const fs = require('node:fs');
const path = require('node:path');
// Require the necessairy discord.js classes
const { Client, Events, GatewayIntentBits, Collection } = require('discord.js');
const { token } = require('./config.json');

// Create a new client instance
// Note: Discord servers are referred to as a "guild" by the Discord API and in discord.js
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// The Collection class extends JavaScript's native Map class, and includes more extensive, useful functionality.
// Collection is used to store and efficiently retrieve commands for execution
client.commands = new Collection();

const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const filePath = path.join(commandsPath, file);
	const command = require(filePath);
	// Set a new item in the Collection with the key as the command name and the value as the exported module.
	if ('data' in command && 'execute' in command) {
		client.commands.set(command.data.name, command);
	} else {
		console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
	}
}

// Receiving command interactions.
// Every slash command is an interaction, so to respond to a command,
// you need to create a listener for the Client#event:interactionCreate event that will execute code when the application receives an interaction.
// However, not every interaction is a slash command (e.g. MessageComponent interactions).
// We make sure to only handle slash commands in this function by making use of the BaseInteractions#isChatInputCommand method to exit the handler if another type is encountered.
client.on(Events.InteractionCreate, async interaction => {
	if (!interaction.isChatInputCommand()) return;

	const command = interaction.client.commands.get(interaction.commandName);

	if (!command) {
		console.error(`No command matching ${interaction.commandName} was found.`);
		return;
	}

	try {
		await command.execute(interaction);
	} catch (error) {
		console.error(error);
		await interaction.reply({ content: 'There was an error while executing this command!', ephemeral:true });
	}

	console.log(interaction);
});

// When the client is ready, run this code (Only once)
// We use 'c' for the event parameter to keep it seperate from the already definede 'client'
client.once(Events.ClientReady, c => { console.log(`Ready! Logged in as ${c.user.tag}`); });

// Log in to Discord with your client's token
client.login(token);

