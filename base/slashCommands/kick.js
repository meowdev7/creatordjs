const { ApplicationCommandOptionType, Routes, DataResolver, SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const errorHandler = require("../functions/errorHandler");

module.exports = {
    data: new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Kick a user with a reason')
    .addUserOption(option => option.setName('user').setDescription('The user to be kicked').setRequired(true))
    .addStringOption(option => option.setName('reason').setDescription('The reason behind kicking them')),
    userPermission: ["KickMembers"],
    botPermission: ["KickMembers"],
    async execute(interaction) {
    const user = interaction.options.getUser('user')
    const reason = interaction.options.getString('reason') || 'No reason provided'
    const target = await interaction.guild.members.fetch(user.id);
    if (!target.kickable) {
        return interaction.reply('I can\'t kick that user')
    }
    try {
       await target.kick(reason) 
    } catch (err) {
        errorHandler(err)
        return interaction.reply(`Error kicking the user : ${user}`)
    }
    return interaction.reply({embeds : [new EmbedBuilder().setTitle(`Member kicked`).setDescription(`${user} has been kicked successfully!`).setColor(`Green`).addFields({name: `Reason:`, value: reason})]})
    }
}