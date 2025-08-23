import { REST, Routes, SlashCommandBuilder } from "discord.js";
import data from "./config.json" with { type: "json" };

async function UpdateCommands() {
  const commands = [
  new SlashCommandBuilder()
    .setName("menu")
    .setDescription("show kits menu")
    .toJSON(),
  ];
  const rest = new REST({ version: "10"}).setToken(data.token);
  try {
    console.log("[Console] Refreshing slash commands...");

    await rest.put(
      Routes.applicationCommands(data.ClientID),
      { body: commands },
    );

    console.log("[Console] Slash commands registered!");
  }
  catch (err) {
    console.error(err);
  }
}

export {UpdateCommands};