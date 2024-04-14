const { ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const ms = require('ms');
const errorHandler = require("../functions/errorHandler");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('timeout')
        .setDescription('Timeout a user with a reason for a specific period of time')
        .addUserOption(option => option.setName('user').setDescription('The user to be timed out').setRequired(true))
        .addStringOption(option => option.setName('duration').setDescription('The duration [15m , 15h, 15d, 15w]').setRequired(true))
        .addStringOption(option => option.setName('reason').setDescription('The reason behind timing out the user')),
    userPermission: ["ModerateMembers"],
    botPermission: ["ModerateMembers"],
    async execute(interaction) {
        const user = interaction.options.getUser('user');
        const reason = interaction.options.getString('reason') || 'No reason provided';
        const duration = interaction.options.getString('duration');
        const target = await interaction.guild.members.fetch(user.id);
        await interaction.deferReply();

        if (!target) {
            await interaction.editReply('The user doesn\'t exist.');
            return;
        }

        if (target.user.bot) {
            await interaction.editReply('Bots cannot be timed out.');
            return;
        }

        const msTime = ms(duration);

        if (isNaN(msTime)) {
            await interaction.editReply('Please provide a valid duration.');
            return;
        }

        if (msTime < 5000 || msTime > 2.419e9) {
            await interaction.editReply('Duration cannot be less than 5 seconds and more than 4 weeks.');
            return;
        }

        const targetPos = target.roles.highest.position;
        const execPos = interaction.member.roles.highest.position;
        const botPos = interaction.guild.members.me.roles.highest.position;

        if (targetPos >= execPos) {
            await interaction.editReply('You cannot timeout the user as they have the same as you or have a higher role than you.');
            return;
        }

        if (targetPos >= botPos) {
            await interaction.editReply('I cannot timeout the user as they have the same as me or have a higher role than me.');
            return;
        }

        try {
            const prettyTime = ms(msTime, { long: true });
            await target.timeout(msTime, reason);
            await interaction.editReply({ embeds: [new EmbedBuilder().setTitle(`Member timed out`).setDescription(`${target} has been timed out for ${prettyTime}`).setColor(`Green`).addFields({ name: `Reason:`, value: reason })] });
        } catch (err) {
            errorHandler(err)
            return await interaction.editReply(`Error occurred while timing out the user: ${target}: ${err}`);
        }
    }
};
