const { ApplicationCommandOptionType, Routes, DataResolver, SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const errorHandler = require("../functions/errorHandler");

module.exports = {
    data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('ban a user with a reason')
    .addUserOption(option => option.setName('user').setDescription('The user to be banned').setRequired(true))
    .addStringOption(option => option.setName('reason').setDescription('The reason behind banning them')),
    userPermission: ["BanMembers"],
    botPermission: ["BanMembers"],
    async execute(interaction) {
    const user = interaction.options.getUser('user')
    const reason = interaction.options.getString('reason') || 'No reason provided'
    const target = await interaction.guild.members.fetch(user.id);
    if (!target.bannable) {
        return interaction.reply('I can\'t ban that user')
    }
    try {
       await target.ban(reason) 
    } catch (err) {
        errorHandler(err)
        return interaction.reply(`Error banning the user : ${user}`)
    }
    return interaction.reply({embeds : [new EmbedBuilder().setTitle(`Member banned`).setDescription(`${user} has been banned successfully!`).setColor(`Green`).addFields({name: `Reason:`, value: reason})]})
    }
}