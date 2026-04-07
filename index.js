const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const http = require('http');

const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.DISCORD_CLIENT_ID;

// Keep-alive for Render
http.createServer((req, res) => res.end('Hecker is alive!')).listen(3000);

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMembers,
  ],
});

const commands = [
  new SlashCommandBuilder()
    .setName('disconnectallroles')
    .setDescription('Hecker: Disconnect all members with a role from VC')
    .addRoleOption(option =>
      option.setName('role').setDescription('The role to disconnect').setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.MoveMembers)
    .toJSON(),
];

const rest = new REST({ version: '10' }).setToken(TOKEN);

client.once('ready', async () => {
  console.log(`✅ Hecker is online as ${client.user.tag}`);
  await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
  console.log('✅ Slash commands registered!');
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  if (interaction.commandName !== 'disconnectallroles') return;

  await interaction.deferReply({ ephemeral: true });

  const role = interaction.options.getRole('role');
  await interaction.guild.members.fetch();

  const inVC = interaction.guild.members.cache.filter(
    m => m.roles.cache.has(role.id) && m.voice.channelId !== null
  );

  if (inVC.size === 0) {
    return interaction.editReply(`❌ No members with **${role.name}** are in a voice channel.`);
  }

  let disconnected = 0;
  for (const [, member] of inVC) {
    try {
      await member.voice.disconnect();
      disconnected++;
    } catch {}
  }

  interaction.editReply(`✅ Disconnected **${disconnected}** member(s) with role **${role.name}**.`);
});

client.login(TOKEN);
