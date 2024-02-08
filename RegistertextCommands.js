 
const { REST, Routes} =  require('discord.js');
const { token } = require('./config.json');


const commands = [
  {
    name:"menu",
    description: 'Envia la informacion del menu'
  }
];

const rest = new REST({ version: '10' }).setToken(token);

(async () => {
try {
  console.log('Started refreshing application (/) commands.');

  await rest.put(Routes.applicationCommands("1189963367314637002"), { body: commands });

  console.log('Successfully reloaded application (/) commands.');
} catch (error) {
  console.error(error);
}
})();