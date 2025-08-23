const initBot = require("./bot");
const deployCmds = require("./deploy-command")
const { v4: uuidv4 } = require("uuid");
const {
  VoucherUserField,
  VoucherKitField,
  VoucherTitle,
  UserTryingToDeliverToBotError,
  UnSelectedKitEmoji,
  SelectedKitEmoji,
  RepresentativeKitEmoji,
  MaxDeliverKits,
  KitsDict,
  VoucherText,
  GenericError,
  ModalAskTitle,
  MinecraftEmptyServerError,
  ServerRestartError,
  KitMenuOpenText,
  EmbedTitle,
  Embed1Title,
  Embed2Title,
  Embed3Title,
  Embed1Content,
  Embed2Content,
  Embed3Content,
  version,
  KitDelayMessage,
  MinuteKitDelay,
  token,
  username,
  KitSelectionMenuTitle,
  ModalPlaceHolder,
  ModalLabel,
} = require("./config.json");
const {
  ModalBuilder,
  TextInputBuilder,
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ButtonBuilder,
  ActionRowBuilder,
  ButtonStyle,
  PermissionsBitField,
  TextInputStyle,
  MessageFlags,
} = require("discord.js");
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

let row = new ActionRowBuilder(); //This just generates the kit's selection button
row.addComponents(
  new ButtonBuilder()
    .setCustomId("ShowMenu")
    .setLabel(KitMenuOpenText)
    .setStyle(ButtonStyle.Success)
);

let DiscordUserInfo = {};

client.on("clientReady", () => {
  console.log(`Logged in as ${client.user.tag}!`); //Shows the bot's username when logged in (to discord)
  deployCmds.UpdateCommands()
});
Bindings = {};
const mcData = require("minecraft-data")(version); //Gets the minecraft version from the config file
for (i = 0; i < Object.keys(KitsDict).length; i++) {
  //Iterates over the kit's bindings dict
  Bindings[Object.keys(KitsDict)[i]] =
    mcData.blocksByName[KitsDict[Object.keys(KitsDict)[i]]].id; //Block name to ID for the pathfinder to know
}

async function wait_for_load() {
  await new Promise((resolve) => setTimeout(resolve, 2000)); //Waits 2 seconds for the bot to load
}
wait_for_load();
client.login(token); //Log in to discord

//Refresh embed function
async function refrescar(id, interaccion) {
  let row2 = new ActionRowBuilder(); //This creates a new row for the buttons
  EmbedMenu = new EmbedBuilder()
    .setTitle(KitSelectionMenuTitle)
    .setColor("Random");
  const repeticiones = {};
  DiscordUserInfo[id].Kits.forEach((numero) => {
    //How many times a kit has been selected
    repeticiones[numero] = (repeticiones[numero] || 0) + 1;
  });

  row2.addComponents(
    //Button to change an index
    new ButtonBuilder()
      .setCustomId(id + "-0")
      .setLabel("⬆️")
      .setStyle(ButtonStyle.Secondary)
  );

  if (DiscordUserInfo[id].Kits.length >= MaxDeliverKits) {
    //Button to add kits (verifies if a maximum ammount has been reached)
    row2.addComponents(
      new ButtonBuilder()
        .setCustomId(id + "-1")
        .setLabel("➕")
        .setDisabled(true)
        .setStyle(ButtonStyle.Primary)
    );
  } else {
    //If we don't have the maximum ammount of kits then the button is enabled
    row2.addComponents(
      new ButtonBuilder()
        .setCustomId(id + "-1")
        .setLabel("➕")
        .setStyle(ButtonStyle.Primary)
    );
  }

  if (DiscordUserInfo[id].Kits.length < 1) {
    //Send button, If less than 1 kit is selected then it is disabled
    row2.addComponents(
      new ButtonBuilder()
        .setCustomId(id + "-2")
        .setLabel(">")
        .setDisabled(true)
        .setStyle(ButtonStyle.Success)
    );
  } else {
    //Enabled because 1 or more kits
    row2.addComponents(
      new ButtonBuilder()
        .setCustomId(id + "-2")
        .setLabel(">")
        .setStyle(ButtonStyle.Success)
    );
  }
  if (
    repeticiones[Object.keys(Bindings)[DiscordUserInfo[id].index]] == undefined
  ) {
    //If the user has a kit that it's selected by index then they can remove it, in this case he does not, so it is disabled
    row2.addComponents(
      new ButtonBuilder()
        .setCustomId(id + "-3")
        .setLabel("➖")
        .setDisabled(true)
        .setStyle(ButtonStyle.Danger)
    );
  } else {
    //If he does then this is enabled
    row2.addComponents(
      new ButtonBuilder()
        .setCustomId(id + "-3")
        .setLabel("➖")
        .setStyle(ButtonStyle.Danger)
    );
  }

  row2.addComponents(
    //Move an index down
    new ButtonBuilder()
      .setCustomId(id + "-4")
      .setLabel("⬇️")
      .setStyle(ButtonStyle.Secondary)
  );

  Object.keys(Bindings).forEach((key, index) => {
    if (index == DiscordUserInfo[id].index) {
      //If this is the user's selected index
      if (repeticiones[key] != undefined) {
        //If there's atleast one kit of the selected kind
        Cantidad = "";
        for (var i = 0; i < repeticiones[key]; i++) {
          Cantidad = Cantidad + RepresentativeKitEmoji; //For each kit the bot adds a representative emoji
        }
        EmbedMenu.addFields({
          name: SelectedKitEmoji + key + SelectedKitEmoji, //Shows graphically what kit is selected rn
          value: " " + Cantidad,
        });
      } else {
        //If there's no kit of the kind already selected
        EmbedMenu.addFields({
          name: SelectedKitEmoji + key + SelectedKitEmoji, //Shows the user that there's no kit from this kind selected
          value: " ",
        });
      }
    } else {
      //If the user isn't in this index
      if (repeticiones[key] != undefined) {
        // And has kits from this kind selected
        Cantidad = "";
        for (var i = 0; i < repeticiones[key]; i++) {
          //An emoji is added
          Cantidad = Cantidad + RepresentativeKitEmoji;
        }
        EmbedMenu.addFields({
          //And shows that the current user's selection is not this kit
          name: UnSelectedKitEmoji + key + UnSelectedKitEmoji,
          value: " " + Cantidad,
        });
      } else {
        //If there's no kit from the selected kind
        EmbedMenu.addFields({
          name: UnSelectedKitEmoji + key + UnSelectedKitEmoji, //Just shows that there's no kit from this kind selected
          value: " ",
        });
      }
    }
  });
  interaccion.update({ embeds: [EmbedMenu], components: [row2] });
}

initBot();
client.on("interactionCreate", async (interaction) => {
  if (interaction.commandName == "menu") {
    // /Menu embed
    EmbedSetMenu = new EmbedBuilder()
      .setTitle(EmbedTitle)
      .addFields({ name: Embed1Title, value: Embed1Content })
      .addFields({ name: Embed2Title, value: Embed2Content })
      .addFields({ name: Embed3Title, value: Embed3Content })
      .setColor("Orange")
    if (
      //Checks that the one who sent the message has permissions
      interaction.member
        .permissionsIn(interaction.channel)
        .has(PermissionsBitField.Flags.Administrator)
    ) {
      await interaction.reply({content: "The embed has been sent in the channel, now users can access it from here!", flags: MessageFlags.Ephemeral })
      client.channels.cache
        .get(interaction.channelId)
        .send({ embeds: [EmbedSetMenu], components: [row] });
    } else {
      //if the user does not have admin perms then the interaction is replied with a single "No."
      await interaction.reply({ content: "No.", flags: MessageFlags.Ephemeral });
    }
  }
  //Fluffing Furry Identity that made me write this piece of code to detect if the one who asked for the kit is a femboy fox and to send it with a custom ML model (Who else was doing this kind of stuff at 15???)

  /*if (interaction.commandName == "verifyinfo") {
    let row = new ActionRowBuilder()
    row.addComponents(new ButtonBuilder()
    .setCustomId("VerifyUser")
    .setLabel("Verificate Aqui")
    .setStyle(ButtonStyle.Primary))

    EmbedSetMenu = new EmbedBuilder()
    .setTitle("Te interesa entrar al servidor?")
    .addFields({name:"Como verificar:", value:"Simplemente ponte una foto de un zorro antropomorfico y dale click al boton azul de abajo."})
    .setColor("Orange")
    .setFooter({ text: "Hecho con amor por: @HomeBrewerFox" })
    if (interaction.member.permissionsIn(interaction.channel).has(PermissionsBitField.Flags.Administrator)){
    client.channels.cache.get(interaction.channelId).send({embeds:[EmbedSetMenu],components: [row]})
    }
    else {
      await interaction.reply({content:"No.", flags: MessageFlags.Ephemeral})
    }
  }*/
  /*
  if (interaction.customId == "VerifyUser"){
    let NuevoRol = interaction.guild.roles.cache.find(role => role.name === "----Piccole Volpi----");
    try {
      if (interaction.member.roles.cache.has(NuevoRol.id)){
        interaction.reply({embeds:[new EmbedBuilder().setTitle("Ya estas verificado en el servidor").setColor("Orange")], ephemeral:true});
        return;
      }
      
      if (interaction.user.avatarURL() != null){
      const options = {
        method: 'POST',
        url: 'http://127.0.0.1:8000/',
        headers: {},
        formData: {
          'imagen': interaction.user.avatarURL()
        }
      };
      const response = await new Promise((resolve, reject) => {
        request(options, (error, response) => {
          if (error) {
            reject(error);
          } else {
            resolve(response);
          }
        });
      });
      if (JSON.parse(response.body).Resultado == "No") {
        interaction.reply({embeds:[new EmbedBuilder().setTitle("Error, no se encontro un zorro antropomorfico en tu imagen :(").setColor("Red")], ephemeral:true});
        return;
      }
      else {
        interaction.member.roles.add(NuevoRol)
        interaction.reply({embeds:[new EmbedBuilder().setTitle("Bienvenid@ a el servidor de discord de ZampeDiVolpe, hay tantas cosas divertidas por hacer y tantas historias por comenzar :)").setColor("Green")], ephemeral:true});
        return;
      }
    }
    else{
      interaction.reply({embeds:[new EmbedBuilder().setTitle("Error, No tienes una imagen :(").setColor("Red")], ephemeral:true});
      return;
    }
    } catch (error) {
      console.log(error)
      interaction.reply({embeds:[new EmbedBuilder().setTitle("Lastimosamente el servidor de verificacion no es funcional, intentalo mas tarde :(").setColor("Orange")], ephemeral:true});
      return;
    }

  }
  */
  if (interaction.customId == "ShowMenu") {
    //Esta parte es para verificar al pedir un kit la foto del usuario con una api, no debe decomentarse a menos de que sepas lo que haces
    /*try {
      if (interaction.user.avatarURL() != null){
      const options = {
        method: 'POST',
        url: 'http://127.0.0.1:8000/',
        headers: {},
        formData: {
          'imagen': interaction.user.avatarURL()
        }
      };
      const response = await new Promise((resolve, reject) => {
        request(options, (error, response) => {
          if (error) {
            reject(error);
          } else {
            resolve(response);
          }
        });
      });
      if (JSON.parse(response.body).Resultado == "No" && !interaction.member.permissionsIn(interaction.channel).has(PermissionsBitField.Flags.Administrator)) {
        interaction.reply({embeds:[new EmbedBuilder().setTitle("Error, No tu imagen aparenta no contener un zorro antropomorfico, porfavor cambiala :(").setColor("Red")], ephemeral:true});
        return;
      }
    }
    else{
      interaction.reply({embeds:[new EmbedBuilder().setTitle("Error, No eres un zorro antro :(").setColor("Red")], ephemeral:true});
      return;
    }
    } catch (error) {
      console.error(error);
    }*/

    if (DiscordUserInfo[interaction.user.id] == undefined) {
      //If the user doesn't have an interaction then a new one is created
      DiscordUserInfo[interaction.user.id] = {
        Timestamp: Date.now(),
        Kits: [],
        index: 0,
        interaccion: undefined,
      };
    } else {
      //In case there's an interaction
      if (
        //Checks that there's no remaining timeout
        DiscordUserInfo[interaction.user.id].Timestamp + MinuteKitDelay * 60 <
          Date.now() &&
        !interaction.member
          .permissionsIn(interaction.channel)
          .has(PermissionsBitField.Flags.Administrator) //If the user is an admin then there will not be any delay
      ) {
        await interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setTitle(
                KitDelayMessage.replaceAll("{{MinuteKitDelay}}", MinuteKitDelay)
              )
              .setColor("Red"),
          ],
          flags: MessageFlags.Ephemeral,
        });
        return;
      } else {
        // If there's no remaining timeout then the info is refreshed
        DiscordUserInfo[interaction.user.id] = {
          Timestamp: Date.now(),
          Kits: [],
          index: 0,
          interaccion: undefined,
        };
      }
    }

    let row2 = new ActionRowBuilder(); //Creates the second row after requesting the menu
    row2.addComponents(
      new ButtonBuilder()
        .setCustomId(interaction.user.id + "-0")
        .setLabel("⬆️")
        .setStyle(ButtonStyle.Secondary)
    );

    row2.addComponents(
      new ButtonBuilder()
        .setCustomId(interaction.user.id + "-1")
        .setLabel("➕")
        .setStyle(ButtonStyle.Primary)
    );

    row2.addComponents(
      new ButtonBuilder()
        .setCustomId(interaction.user.id + "-2")
        .setLabel(">")
        .setDisabled(true)
        .setStyle(ButtonStyle.Success)
    );

    row2.addComponents(
      new ButtonBuilder()
        .setCustomId(interaction.user.id + "-3")
        .setLabel("➖")
        .setDisabled(true)
        .setStyle(ButtonStyle.Danger)
    );

    row2.addComponents(
      new ButtonBuilder()
        .setCustomId(interaction.user.id + "-4")
        .setLabel("⬇️")
        .setStyle(ButtonStyle.Secondary)
    );

    EmbedMenu = new EmbedBuilder()
      .setTitle(KitSelectionMenuTitle)
      .setColor("Random");
    Object.keys(Bindings).forEach((key, index) => {
      if (index == DiscordUserInfo[interaction.user.id].index) {
        // Checks if the user has the selected kit on the current iteration
        EmbedMenu.addFields({
          name: SelectedKitEmoji + key + SelectedKitEmoji, //if so, the selected emoji is concatenated
          value: " ",
        });
      } else {
        EmbedMenu.addFields({
          name: UnSelectedKitEmoji + key + UnSelectedKitEmoji, //else the emoji that represents non selected items is concatenated
          value: " ",
        });
      }
    });
    DiscordUserInfo[interaction.user.id].interaccion = interaction;
    await interaction.reply({
      //Replies with the generated embed
      embeds: [EmbedMenu],
      flags: MessageFlags.Ephemeral,
      components: [row2],
    });
  }

  if (interaction.customId == interaction.user.id + "-0") {
    //Handles the behaviour of the down button
    try {
      DiscordUserInfo[interaction.user.id].index =
        DiscordUserInfo[interaction.user.id].index - 1; //Index -1 
      if (DiscordUserInfo[interaction.user.id].index < 0) {
        //If the index is less than 0 then the item that is put is the first
        DiscordUserInfo[interaction.user.id].index =
          Object.keys(Bindings).length - 1;
      }

      refrescar(interaction.user.id, interaction); //Refreshes the interaction
    } catch {
      // If something passes then the bot infers that something happened
      await interaction.update({
        embeds: [
          new EmbedBuilder().setTitle(ServerRestartError).setColor("Red"),
        ],
        components: [],
        flags: MessageFlags.Ephemeral,
      });
    }
  }
  if (interaction.customId == interaction.user.id + "-1") {
    //Behaviour of the kit adding button
    try {
      DiscordUserInfo[interaction.user.id].Kits.push(
        Object.keys(Bindings)[DiscordUserInfo[interaction.user.id].index]
      );

      refrescar(interaction.user.id, interaction); //After adding a kit the interaction is refreshed
    } catch {
      // If something happens then it is infered that the server restarted
      await interaction.update({
        embeds: [
          new EmbedBuilder().setTitle(ServerRestartError).setColor("Red"),
        ],
        components: [],
        flags: MessageFlags.Ephemeral,
      });
    }
  }

  if (interaction.customId == interaction.user.id + "-2") {
    //Send button handler
    try {
      if (DiscordUserInfo[interaction.user.id] == undefined) {
        await interaction.update({
          embeds: [
            new EmbedBuilder().setTitle(ServerRestartError).setColor("Red"),
          ],
          flags: MessageFlags.Ephemeral,
          components: [],
        });
        return;
      }
      let modal = new ModalBuilder({
        custom_id: interaction.user.id + "-prompt",
        title: ModalAskTitle,
      });
      let usernameinput = new TextInputBuilder()
        .setCustomId("Username")
        .setPlaceholder(ModalPlaceHolder)
        .setRequired(true)
        .setStyle(TextInputStyle.Short)
        .setLabel(ModalLabel);
      modal.addComponents(new ActionRowBuilder().addComponents(usernameinput));

      usuarios = await initBot.ObtenerUsuariosEnLinea(); //Gets the users that are currently connected on the server
      if (Object.keys(usuarios).length >= 2) {
        //If there are two or more players in the server then the modal is shown
        await interaction.showModal(modal);
      } else {
        //If there are less than 2 players the empty server error will be sent
        await DiscordUserInfo[interaction.user.id].interaccion.deleteReply();
        await interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setTitle(MinecraftEmptyServerError)
              .setColor("Red"),
          ],
          flags: MessageFlags.Ephemeral,
        });
        return;
      }
    } catch (e) {
      //In case of an error then the assumption will be that the server shut down
      console.log(e);
      await interaction.reply({
        embeds: [
          new EmbedBuilder().setTitle(ServerRestartError).setColor("Red"),
        ],
        flags: MessageFlags.Ephemeral,
      });
    }
  }

  if (interaction.customId == interaction.user.id + "-3") {
    //Remove button handler
    try {
      const indexToRemove = DiscordUserInfo[interaction.user.id].Kits.findIndex(
        (kit) =>
          kit ===
          Object.keys(Bindings)[DiscordUserInfo[interaction.user.id].index] //Finds the index of the kit to remove
      );
      if (indexToRemove !== -1) {
        DiscordUserInfo[interaction.user.id].Kits.splice(indexToRemove, 1); //If the kit is found then remove it
      }

      refrescar(interaction.user.id, interaction); //The kit's menu is refreshed
    } catch {
      //In case of an error then the assumption will be that the server shut down
      await interaction.update({
        embeds: [
          new EmbedBuilder().setTitle(ServerRestartError).setColor("Red"),
        ],
        components: [],
        flags: MessageFlags.Ephemeral,
      });
    }
  }

  if (interaction.customId == interaction.user.id + "-prompt") {
    //Receives the username answer
    try {
      let UsernameFound = false;
      usuarios = await initBot.ObtenerUsuariosEnLinea(); //Gets the users that are currently in the server
      if (
        interaction.fields.getTextInputValue("Username").toLowerCase() ==
        username.toLowerCase()
      ) {
        interaction.update({
          embeds: [
            new EmbedBuilder()
              .setTitle(UserTryingToDeliverToBotError)
              .setColor("Red"),
          ],
          components: [],
          flags: MessageFlags.Ephemeral,
        });
        DiscordUserInfo[interaction.user.id] = undefined;
        return;
      }
      for (var i = 0; i < Object.keys(usuarios).length; i++) {
        if (
          Object.keys(usuarios)[i] ==
          interaction.fields.getTextInputValue("Username")
        ) {
          UsernameFound = true;
          break;
        }
      }
      if (UsernameFound == false) {
        await interaction.update({
          embeds: [
            new EmbedBuilder()
              .setTitle(MinecraftEmptyServerError)
              .setColor("Red"),
          ],
          components: [],
          flags: MessageFlags.Ephemeral,
        });
        return;
      }
      const uuid = uuidv4();
      var NombreKits = "";
      var KitsValues = [];
      for (
        var i = 0;
        i < DiscordUserInfo[interaction.user.id].Kits.length;
        i++
      ) {
        // Appends the kit's name to a string that is going to be sent in the voucher
        NombreKits =
          NombreKits + " " + DiscordUserInfo[interaction.user.id].Kits[i];
        KitsValues.push(Bindings[DiscordUserInfo[interaction.user.id].Kits[i]]);
      }
      EmbedKitEnviado = new EmbedBuilder() // Voucher's embed
        .setTitle(VoucherTitle)
        .addFields({
          name: "-----------------------------------------------------------------------------------",
          value: " ",
        })
        .addFields({
          name: VoucherUserField,
          value: interaction.fields.getTextInputValue("Username"),
          inline: true,
        })
        .addFields({ name: VoucherKitField, value: NombreKits, inline: true })
        .addFields({ name: "ID:", value: uuid })
        .addFields({
          name: "-----------------------------------------------------------------------------------",
          value: " ",
        })
        .setDescription(VoucherText)
        .setColor("Green");
      await interaction.reply({ embeds: [EmbedKitEnviado], flags: MessageFlags.Ephemeral });
      await DiscordUserInfo[interaction.user.id].interaccion.deleteReply();
      initBot.QueueDelivery(
        KitsValues,
        interaction.fields.getTextInputValue("Username"),
        uuid
      ); //The kit is sent into the queue
    } catch (e) {
      console.log(e);
      interaction.reply({
        embeds: [new EmbedBuilder().setTitle(GenericError).setColor("Red")],
        flags: MessageFlags.Ephemeral,
      });
    }
  }

  if (interaction.customId == interaction.user.id + "-4") {
    // Up button behaviour
    try {
      DiscordUserInfo[interaction.user.id].index =
        DiscordUserInfo[interaction.user.id].index + 1; //Item +1
      if (
        //If we are on the top item then we jump to the last
        DiscordUserInfo[interaction.user.id].index >
        Object.keys(Bindings).length - 1
      ) {
        DiscordUserInfo[interaction.user.id].index = 0;
      }

      refrescar(interaction.user.id, interaction); //The kit selector is refreshed
    } catch {
      await interaction.update({
        embeds: [
          new EmbedBuilder().setTitle(ServerRestartError).setColor("Red"),
        ],
        components: [],
        flags: MessageFlags.Ephemeral,
      });
    }
  }
});
