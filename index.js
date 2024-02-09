const initBot = require("./bot");
const { v4: uuidv4 } = require("uuid");
const {
  UserTryingToDeliverToBotError,
  UnSelectedKitEmoji,
  SelectedKitEmoji,
  RepresentativeKitEmoji,
  MaxDeliverKits,
  KitsDict,
  VoucherText,
  GenericError,
  NameAskMessage,
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
  StringSelectMenuBuilder,
  TextInputStyle,
} = require("discord.js");
const client = new Client({ intents: [GatewayIntentBits.Guilds] });
// var request = require('request');

let row = new ActionRowBuilder(); //Se encarga del boton para abrir el selector de kits
row.addComponents(
  new ButtonBuilder()
    .setCustomId("ShowMenu")
    .setLabel(KitMenuOpenText)
    .setStyle(ButtonStyle.Success)
);

let DiscordUserInfo = {};

client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag}!`); //Muestra el usuario del bot cuando se loggea
});
Bindings = {};
const mcData = require("minecraft-data")(version); //Obtiene datos de la version de minecraft del archivo de configuracion
for (i = 0; i < Object.keys(KitsDict).length; i++) {
  //Itera sobre cada key del diccionario que almacena los kits y su id de bloque
  Bindings[Object.keys(KitsDict)[i]] =
    mcData.blocksByName[KitsDict[Object.keys(KitsDict)[i]]].id; //Convierte el bloque que esta en texto a un id que pueda reconocer el pathfinder
}

async function no_se() {
  await new Promise((resolve) => setTimeout(resolve, 2000)); //Espera 2 segundos de carga
}
no_se();
client.login(token); //Inicia sesion el bot de discord

async function refrescar(id, interaccion) {
  let row2 = new ActionRowBuilder(); //Crea un nuevo row en el que van a ir las acciones
  EmbedMenu = new EmbedBuilder()
    .setTitle(KitSelectionMenuTitle)
    .setColor("Random")
    .setFooter({
      text: "Hecho con amor por:                                      @HomeBrewerFox",
    });
  const repeticiones = {};
  DiscordUserInfo[id].Kits.forEach((numero) => {
    //Obtiene cuantas veces se ha seleccionado cada kit.
    repeticiones[numero] = (repeticiones[numero] || 0) + 1;
  });

  row2.addComponents(
    //Boton para cambiar subir un indice
    new ButtonBuilder()
      .setCustomId(id + "-0")
      .setLabel("⬆️")
      .setStyle(ButtonStyle.Secondary)
  );

  if (DiscordUserInfo[id].Kits.length >= MaxDeliverKits) {
    //Boton para agregar kits, verifica si ya se ha llegado al maximo interpuesto por el usuario, y si es asi lo desactiva
    row2.addComponents(
      new ButtonBuilder()
        .setCustomId(id + "-1")
        .setLabel("➕")
        .setDisabled(true)
        .setStyle(ButtonStyle.Primary)
    );
  } else {
    //En caso de que no tengas el maximo de kits el boton va a estar activo
    row2.addComponents(
      new ButtonBuilder()
        .setCustomId(id + "-1")
        .setLabel("➕")
        .setStyle(ButtonStyle.Primary)
    );
  }

  if (DiscordUserInfo[id].Kits.length < 1) {
    //Boton de enviar, si no tienes mas de un kit esta desactivado
    row2.addComponents(
      new ButtonBuilder()
        .setCustomId(id + "-2")
        .setLabel(">")
        .setDisabled(true)
        .setStyle(ButtonStyle.Success)
    );
  } else {
    //Esta activado porque hay un kit o mas
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
    //Si el usuario no tiene un kit del tipo en el que esta su indice no puede eliminarlo, por lo que el boton de resta esta desactivado
    row2.addComponents(
      new ButtonBuilder()
        .setCustomId(id + "-3")
        .setLabel("➖")
        .setDisabled(true)
        .setStyle(ButtonStyle.Danger)
    );
  } else {
    //Y si lo tiene el boton esta activado
    row2.addComponents(
      new ButtonBuilder()
        .setCustomId(id + "-3")
        .setLabel("➖")
        .setStyle(ButtonStyle.Danger)
    );
  }

  row2.addComponents(
    //Boton para cambiar bajar un indice
    new ButtonBuilder()
      .setCustomId(id + "-4")
      .setLabel("⬇️")
      .setStyle(ButtonStyle.Secondary)
  );

  Object.keys(Bindings).forEach((key, index) => {
    if (index == DiscordUserInfo[id].index) {
      //Si el indice es en el que esta el usuario actualmente
      if (repeticiones[key] != undefined) {
        //Si existe almenos un kit del tipo actual
        Cantidad = "";
        for (var i = 0; i < repeticiones[key]; i++) {
          Cantidad = Cantidad + RepresentativeKitEmoji; //Por cada kit del tipo en el que este iterando actualmente añade un emoji representativo
        }
        EmbedMenu.addFields({
          name: SelectedKitEmoji + key + SelectedKitEmoji, //Graficamente le muestra al usuario el kit que esta seleccionado actualmente
          value: " " + Cantidad,
        });
      } else {
        //Si no existe ningun kit del tipo actual
        EmbedMenu.addFields({
          name: SelectedKitEmoji + key + SelectedKitEmoji, //Solamente le muestra graficamente que no tiene ningun kit de este tipo seleccionado
          value: " ",
        });
      }
    } else {
      //Si el indice no es en el que esta el usuario actualmente
      if (repeticiones[key] != undefined) {
        // Y tiene kits seleccionados de este tipo
        Cantidad = "";
        for (var i = 0; i < repeticiones[key]; i++) {
          //Por cada kit del tipo en el que este iterando actualmente añade un emoji representativo
          Cantidad = Cantidad + RepresentativeKitEmoji;
        }
        EmbedMenu.addFields({
          //Graficamente le muestra al usuario el kit que no esta seleccionado actualmente
          name: UnSelectedKitEmoji + key + UnSelectedKitEmoji,
          value: " " + Cantidad,
        });
      } else {
        //Si no existe ningun kit del tipo actual
        EmbedMenu.addFields({
          name: UnSelectedKitEmoji + key + UnSelectedKitEmoji, //Solamente le muestra graficamente que no tiene ningun kit de este tipo seleccionado y que tampoco esta sobre este indice
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
    //Embed del comando /menu, este muestra el boton para abrir el selector de kits
    EmbedSetMenu = new EmbedBuilder()
      .setTitle(EmbedTitle)
      .addFields({ name: Embed1Title, value: Embed1Content })
      .addFields({ name: Embed2Title, value: Embed2Content })
      .addFields({ name: Embed3Title, value: Embed3Content })
      .setColor("Orange")
      .setFooter({ text: "Hecho con amor por: @HomeBrewerFox" });
    if (
      //Verifica que la persona que envio el mensaje tenga permisos
      interaction.member
        .permissionsIn(interaction.channel)
        .has(PermissionsBitField.Flags.Administrator)
    ) {
      client.channels.cache
        .get(interaction.channelId)
        .send({ embeds: [EmbedSetMenu], components: [row] });
    } else {
      //Si no los tiene no va a enviar nada
      await interaction.reply({ content: "No.", ephemeral: true });
    }
  }
  //Este comentario es de un sistema de verificacion con una api de reconocimiento de imagen, puede ser probada pero no es recomendado
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
      await interaction.reply({content:"No.", ephemeral: true})
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
      //Si el usuario no tiene una interaccion se crea una
      DiscordUserInfo[interaction.user.id] = {
        Timestamp: Date.now(),
        Kits: [],
        index: 0,
        interaccion: undefined,
      };
    } else {
      //En caso de que ya tenga una interaccion
      if (
        //Verifica que ya haya pasado un el delay de configuracion desde el ultimo intento de crear una nueva
        DiscordUserInfo[interaction.user.id].Timestamp + MinuteKitDelay * 60 <
          Date.now() &&
        !interaction.member
          .permissionsIn(interaction.channel)
          .has(PermissionsBitField.Flags.Administrator) //Si el usuario no es administrador va a hacer que el delay sea valido, en caso de que sea administrador no va a haber delay
      ) {
        await interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setTitle(
                KitDelayMessage.replaceAll("{{MinuteKitDelay}}", MinuteKitDelay)
              )
              .setColor("Red"),
          ],
          ephemeral: true,
        });
        return;
      } else {
        // Si ya paso el delay se reinicia la informacion del selector
        DiscordUserInfo[interaction.user.id] = {
          Timestamp: Date.now(),
          Kits: [],
          index: 0,
          interaccion: undefined,
        };
      }
    }

    let row2 = new ActionRowBuilder(); //Se crea el menu con el que se inicia justo despues de solicitar el menu
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
      .setColor("Random")
      .setFooter({
        text: "Hecho con amor por:                                      @HomeBrewerFox",
      });
    Object.keys(Bindings).forEach((key, index) => {
      if (index == DiscordUserInfo[interaction.user.id].index) {
        // Verifica si el usuario tiene seleccionado el kit de esta iteracion
        EmbedMenu.addFields({
          name: SelectedKitEmoji + key + SelectedKitEmoji, //Si es asi pone el emoji de seleccionado
          value: " ",
        });
      } else {
        EmbedMenu.addFields({
          name: UnSelectedKitEmoji + key + UnSelectedKitEmoji, //Si no pone el que dice que no esta seleccionado
          value: " ",
        });
      }
    });
    DiscordUserInfo[interaction.user.id].interaccion = interaction;
    await interaction.reply({
      //Responde con el embed recien generado
      embeds: [EmbedMenu],
      ephemeral: true,
      components: [row2],
    });
  }

  if (interaction.customId == interaction.user.id + "-0") {
    //Handling del comportamiento del boton hacia abajo
    try {
      DiscordUserInfo[interaction.user.id].index =
        DiscordUserInfo[interaction.user.id].index - 1; //Se reduce el indice
      if (DiscordUserInfo[interaction.user.id].index < 0) {
        //Si es menor que cero se pone como el indice maximo (ultimo item)
        DiscordUserInfo[interaction.user.id].index =
          Object.keys(Bindings).length - 1;
      }

      refrescar(interaction.user.id, interaction); //Se refresca la interaccion
    } catch {
      // En caso de que algo pase se asume que el servidor se reincio
      await interaction.update({
        embeds: [
          new EmbedBuilder().setTitle(ServerRestartError).setColor("Red"),
        ],
        components: [],
        ephemeral: true,
      });
    }
  }
  if (interaction.customId == interaction.user.id + "-1") {
    //Handler del comportamiento de añadir kits
    try {
      DiscordUserInfo[interaction.user.id].Kits.push(
        Object.keys(Bindings)[DiscordUserInfo[interaction.user.id].index]
      );

      refrescar(interaction.user.id, interaction); //Despues de añadir el kit actual a la lista de kits se refresca la interaccion
    } catch {
      // En caso de que algo pase se asume que el servidor se reincio
      await interaction.update({
        embeds: [
          new EmbedBuilder().setTitle(ServerRestartError).setColor("Red"),
        ],
        components: [],
        ephemeral: true,
      });
    }
  }

  if (interaction.customId == interaction.user.id + "-2") {
    //Handler del boton de enviar
    try {
      if (DiscordUserInfo[interaction.user.id] == undefined) {
        await interaction.update({
          embeds: [
            new EmbedBuilder().setTitle(ServerRestartError).setColor("Red"),
          ],
          ephemeral: true,
          components: [],
        });
        return;
      }
      let modal = new ModalBuilder({
        custom_id: interaction.user.id + "-prompt",
        title: NameAskMessage,
      });
      let usernameinput = new TextInputBuilder()
        .setCustomId("Username")
        .setPlaceholder("Test input")
        .setRequired(true)
        .setStyle(TextInputStyle.Short)
        .setLabel("Enter Input");
      modal.addComponents(new ActionRowBuilder().addComponents(usernameinput));

      usuarios = await initBot.ObtenerUsuariosEnLinea(); //Obtiene los usuarios que estan actualmente en el servidor
      if (Object.keys(usuarios).length >= 2) {
        //Si hay mas de dos usuarios (El bot y alguien mas) envia el embed para preguntar cual es su nombre
        await interaction.showModal(modal);
      } else {
        //Si no retorna el mensaje de servidor vacio
        await DiscordUserInfo[interaction.user.id].interaccion.deleteReply();
        await interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setTitle(MinecraftEmptyServerError)
              .setColor("Red"),
          ],
          ephemeral: true,
        });
        return;
      }
    } catch (e) {
      //En caso de error se asume que el servidor se cerro
      console.log(e);
      await interaction.reply({
        embeds: [
          new EmbedBuilder().setTitle(ServerRestartError).setColor("Red"),
        ],
        ephemeral: true,
      });
    }
  }

  if (interaction.customId == interaction.user.id + "-3") {
    //Handler del boton de remover
    try {
      const indexToRemove = DiscordUserInfo[interaction.user.id].Kits.findIndex(
        (kit) =>
          kit ===
          Object.keys(Bindings)[DiscordUserInfo[interaction.user.id].index] //Encuentra en que indice de kits se encuentra el kit que se va a remover
      );
      if (indexToRemove !== -1) {
        DiscordUserInfo[interaction.user.id].Kits.splice(indexToRemove, 1); //Si el kit es encontrado se elimina del indice un kit del tipo
      }

      refrescar(interaction.user.id, interaction); //Se refresca el selector de kits
    } catch {
      //En caso de error se asume que el servidor se cerro
      await interaction.update({
        embeds: [
          new EmbedBuilder().setTitle(ServerRestartError).setColor("Red"),
        ],
        components: [],
        ephemeral: true,
      });
    }
  }

  if (interaction.customId == interaction.user.id + "-prompt") {
    //Recibe la respuesta del usuario al seleccionar su usuario
    try {
      let UsernameFound = false;
      usuarios = await initBot.ObtenerUsuariosEnLinea(); //Obtiene los usuarios que estan actualmente en el servidor
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
          ephemeral: true,
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
          ephemeral: true,
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
        // Añade cada kit a un string que se muestra en el voucher
        NombreKits =
          NombreKits + " " + DiscordUserInfo[interaction.user.id].Kits[i];
        KitsValues.push(Bindings[DiscordUserInfo[interaction.user.id].Kits[i]]);
      }
      EmbedKitEnviado = new EmbedBuilder() // El embed del voucher
        .setTitle("Kit Enviado!")
        .addFields({
          name: "-----------------------------------------------------------------------------------",
          value: " ",
        })
        .addFields({
          name: "Usuario:",
          value: interaction.fields.getTextInputValue("Username"),
          inline: true,
        })
        .addFields({ name: "Kits:", value: NombreKits, inline: true })
        .addFields({ name: "ID:", value: uuid })
        .addFields({
          name: "-----------------------------------------------------------------------------------",
          value: " ",
        })
        .setDescription(VoucherText)
        .setColor("Green")
        .setFooter({ text: "Hecho con amor por: @HomeBrewerFox" });
      await interaction.reply({ embeds: [EmbedKitEnviado], ephemeral: true });
      await DiscordUserInfo[interaction.user.id].interaccion.deleteReply();
      initBot.QueueDelivery(
        KitsValues,
        interaction.fields.getTextInputValue("Username"),
        uuid
      ); //Se envia el kit a la cola de envios pendientes
    } catch (e) {
      console.log(e);
      interaction.reply({
        embeds: [new EmbedBuilder().setTitle(GenericError).setColor("Red")],
        ephemeral: true,
      });
    }
  }

  if (interaction.customId == interaction.user.id + "-4") {
    //Handling del comportamiento del boton hacia abajo
    try {
      DiscordUserInfo[interaction.user.id].index =
        DiscordUserInfo[interaction.user.id].index + 1; //Se suma uno al indice
      if (
        //En caso de que ya sea el maximo se pasa a el primer item
        DiscordUserInfo[interaction.user.id].index >
        Object.keys(Bindings).length - 1
      ) {
        DiscordUserInfo[interaction.user.id].index = 0;
      }

      refrescar(interaction.user.id, interaction); //Se refresca el selector de kits
    } catch {
      await interaction.update({
        embeds: [
          new EmbedBuilder().setTitle(ServerRestartError).setColor("Red"),
        ],
        components: [],
        ephemeral: true,
      });
    }
  }
});
