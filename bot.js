// Se importan modulos y se declaran variables importantes //
const mineflayer = require("mineflayer");
const {
  IsSlashKillAllowed,
  TPAcceptTime,
  ErrorMessage,
  UnstockedItemMessage,
  ExpiredTP,
  AcceptTPASK,
  UTPAcceptMSG,
  UTPCancelMSG,
  LoginMSG,
  RegisterMSG,
  username,
  password,
  host,
  port,
  version,
  TPDelay,
  HomeDelay,
  LavaCoords,
  BotOwner,
  HomeMessage,
  HomeCancelMSG,
  AfterRegisterMSG,
  AfterLoginMSG,
  PlayPremium,
  auth,
  MinecraftAccountPassword, 
  MinecraftAccountEmail
} = require("./config.json");
const fs = require('fs');
const { GoalNear } = require("mineflayer-pathfinder").goals;
console.log("[Console] Creating bot.");
let isBotBusy = false;
QueueItems = {};
CurrentDeliveryID = "";
const { pathfinder, Movements, goals } = require("mineflayer-pathfinder");
const GoalBlock = goals.GoalBlock;
let ShouldBotBeKilled = false;
vec3 = require("vec3");
let botArgs;
let session;

if (fs.existsSync("./accounts/accounts.json")){ //Checks if the path for weird cookie auth exists
  const Auth = require('./accounts/accounts.json');
  session = {
    accessToken: Auth[1].accessToken,
    clientToken: Auth[1].clientToken,
    selectedProfile: {
        id: Auth[1].selectedUser.profile,
        name: Auth[1].displayName
    }
  };
}

// Bot Connection ARGS (Can be set from the config.json file)
if (!session){ // I always expect this...
  if (!PlayPremium) {
    botArgs = {
      host: host, //Server's IP
      port: port, // Server's port
      username: username, //Bot's username
      version: version, //Server's version
    };
  }
  else {
    botArgs = {
      host: host, //Server's IP
      port: port, // Server's port
      username: MinecraftAccountEmail, //Bot's Email
      version: version, //Server's version
      auth: auth, // Auth kind
      password: MinecraftAccountPassword // Account password email
    };
  }
}
else { // If there's a shady session then we try to connect to it
  botArgs = {
    host:host,
    port:port,
    version:version
  }
  botArgs["session"] = session
}

function initBot() {
  let bot = mineflayer.createBot(botArgs);
  bot.loadPlugin(pathfinder);
  const mcData = require("minecraft-data")(bot.version);
  async function ObtenerUsuariosEnLinea() {
    //Exports the players for them to be used in other functions
    return bot.players;
  }

  async function expulsar() {
    await new Promise((resolve) => setTimeout(resolve, TPDelay));
    if (IsSlashKillAllowed == false) {
      //Logic used if /kill is disabled
      itemindex = 0;
      cantidaditems = bot.inventory.items().length; //Gets the ammount of items in the bot's inventory
      for (var i = 0; i < cantidaditems; i++) {
        //Por cada item que tenga en el inventario:
        await new Promise((resolve) => setTimeout(resolve, 500)); //0.5 seconds delay
        const playerFilter = (entity) => entity.type === "player"; //Searches a player to look at
        let player = bot.nearestEntity(playerFilter);
        if (player) {
          bot.lookAt(player.position.offset(0, player.height, 0));
        }
        if (bot.inventory.items()[itemindex] != undefined) {
          //If there's an item in the invenory index
          if (bot.inventory.items()[itemindex].count == 1) {
            try {
              item = bot.inventory.items()[itemindex].slot; //Get the item's slot
              bot.clickWindow(item, 0, 4); //Throws the item by using some low level apis
            } catch {
              continue;
            }
          } else {
            itemindex++; // Adds 1 for each item index
          }
        }
      }
      bot.chat("/home"); //This sends the bot back home, waiting a timeout
      await new Promise((resolve) => setTimeout(resolve, HomeDelay));
    } else {
      bot.chat("/kill");
    }
  }

  async function Suicidio() {
    if (IsSlashKillAllowed == false) {
      const defaultMove = new Movements(bot); //Starts a new movements object for the bot
      defaultMove.blocksToAvoid.delete(mcData.blocksByName.lava.id); //Let's kill ourselves :3
      bot.pathfinder.setMovements(defaultMove);
      bot.pathfinder.setGoal(
        new GoalNear(LavaCoords[0], LavaCoords[1], LavaCoords[2], 2)
      ); //Jump to the lava and die! hehehe
      ShouldBotBeKilled = false;
    } else {
      bot.chat("/kill");
      ShouldBotBeKilled = false;
    }
  }

  async function QueueDelivery(items, usuario, RequestID) {
    //This is accessed externally and contains an array with the user and the Items of the request
    QueueItems[RequestID] = { Usuario: usuario, Items: items };
  }

  function setBusyStatus(estado) {
    isBotBusy = estado; //This wasn't necessary buuut I'd rather to have it here because I wanted to avoid some external problems

  function HandleDelivery() {
    if (Object.keys(QueueItems).length > 0 && isBotBusy == false) {
      //If the bot is not busy and the queue is zero then send the delivery
      SendDelivery(
        QueueItems[Object.keys(QueueItems)[0]].Items,
        QueueItems[Object.keys(QueueItems)[0]].Usuario,
        Object.keys(QueueItems)[0]
      );
      CurrentDeliveryID = Object.keys(QueueItems)[0]; //The delivery is put as current
    }
  }
  async function SendDelivery(identificador, usuario, RequestID) {
    setBusyStatus(true); //Sets the bot in busy state
    bot.once("death", () => {
      //When the bot dies it restarts some values
      ShouldBotBeKilled = false;
      delete QueueItems[RequestID];
      setBusyStatus(false);
    });
    const movements = new Movements(bot, mcData); //This creates movements, but with blocks that should not be broken
    movements.blocksCantBreak.add(mcData.blocksByName.diamond_block.id);
    movements.blocksCantBreak.add(mcData.blocksByName.sandstone.id);
    movements.blocksCantBreak.add(mcData.blocksByName.wither_skeleton_skull.id);
    movements.blocksCantBreak.add(mcData.blocksByName.chest.id);
    movements.blocksCantBreak.add(mcData.blocksByName.cobblestone.id);
    movements.blocksCantBreak.add(mcData.blocksByName.glass.id);
    movements.blocksCantBreak.add(mcData.blocksByName.beacon.id);
    movements.scafoldingBlocks = [];
    bot.pathfinder.setMovements(movements); // Adds the movements to the pathfinder
    ShouldBotBeKilled = true; //Here starts the downhill, the path of kys
    for (var i = 0; i < identificador.length; i++) {
      const KitBlock = bot.findBlock({
        //KitBlock is the representative block of the kit we're searching for
        matching: identificador[i],
        maxDistance: 128,
      });

      if (!KitBlock) {
        //If the block is not found then a message will be sent to the user
        bot.chat(
          "/msg " +
            usuario +
            " " +
            ErrorMessage.replaceAll("{{RequestID}}", RequestID).replaceAll(
              "{{User}}",
              usuario
            )
        );
        ShouldBotBeKilled = false;
        delete QueueItems[RequestID];
        setBusyStatus(false);
        return;
      }

      //If it is found then the bot is going to search them
      var x = KitBlock.position.x;
      var y = KitBlock.position.y;
      var z = KitBlock.position.z + 1;
      var goal = new GoalBlock(x, y, z);
      await bot.pathfinder.goto(goal);
      const chest = bot.findBlock({
        //Finds the lateral chest of the representative block
        matching: mcData.blocksByName.chest.id,
        maxDistance: 2,
      });

      if (!chest) {
        //If the chest is not found then the delivery is cancelled
        bot.chat(
          "/msg " +
            usuario +
            " " +
            ErrorMessage.replaceAll("{{RequestID}}", RequestID).replaceAll(
              "{{User}}",
              usuario
            )
        );
        ShouldBotBeKilled = false;
        delete QueueItems[RequestID];
        setBusyStatus(false);
        return;
      }
      var x = chest.position.x;
      var y = chest.position.y;
      var z = chest.position.z;
      let chest_window = await bot.openChest(bot.blockAt(vec3(x, y, z))); //The chest is opened
      items = chest_window.containerItems(); //Gets the items inside the chest
      if (items.length == 0) { //If there are not kits inside the chest a message will be sent to the user
        await new Promise((resolve) => setTimeout(resolve, 2000));
        bot.chat(
          "/msg " +
            usuario +
            " " +
            UnstockedItemMessage.replaceAll(
              "{{RequestID}}",
              RequestID
            ).replaceAll("{{User}}", usuario)
        );
        bot.closeWindow(chest_window);
      } else {
        //If items are found in the chest then they are going to be withdrawn
        await chest_window.withdraw(items[0].type, null, 1);
        bot.closeWindow(chest_window);
        index = 1;
        await new Promise((resolve) => setTimeout(resolve, 2000)); //Waits 2 seconds to take the item
        while (bot.inventory.items().length == 0) {
          await new Promise((resolve) => setTimeout(resolve, 100));
          index = index + 1;
        }
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 2000)); //2 second delay before sending the tp request
    bot.chat(
      "/msg " +
        usuario +
        " " +
        AcceptTPASK.replaceAll("{{RequestID}}", RequestID)
          .replaceAll("{{User}}", usuario)
          .replaceAll("{{TPAcceptTime}}", TPAcceptTime / 1000)
    );
    bot.chat("/tpa " + usuario); //Sends the request
    let teleportAccepted = false;
    timeoutId = setTimeout(() => {
      // After the time specified in TPAcceptTime passes the tp request gets cancelled and the bot opts for killing himself :3
      bot.chat(
        "/msg " +
          usuario +
          " " +
          ExpiredTP.replaceAll("{{RequestID}}", RequestID).replaceAll(
            "{{User}}",
            usuario
          )
      );
      bot.chat("/tpcancel " + usuario);
      if (ShouldBotBeKilled) {
        Suicidio();
      }
      timeoutId = null; // This just tells that the timeout has executed
    }, TPAcceptTime);

    bot.on("message", (message) => {
      if (
        message == UTPAcceptMSG.replaceAll("{{User}}", usuario) &&
        !teleportAccepted
      ) {
        //If the user accepts the request then
        teleportAccepted = true;
        expulsar();
        clearTimeout(timeoutId); //The timeout is cleared
        return "[OK] El delivery se completo sin ningun percance"; // Perfect status
      }

      if (message == UTPCancelMSG.replaceAll("{{User}}", usuario)) {
        //If the request is cancelled
        if (ShouldBotBeKilled) {
          Suicidio(); //We take the suicide path again (this shit is comical)
        }
        ShouldBotBeKilled = false;
        delete QueueItems[RequestID];
        setBusyStatus(false);
        clearTimeout(timeoutId);
        return "[X]" + usuario + " Cancelo la solicitud";
      }
    });
  }

  // Loads mineflayer

  bot.once("spawn", () => {
    setInterval(HandleDelivery, 2000); //Starts the function to handle the deliveries each 2 seconds
  });

  bot.on("message", (message) => {
    // logs login
    console.log(message.toString());
    if (message.toString() === LoginMSG) {
      bot.chat(`/login ` + password); //Logs in
    }
    if (message.toString() === RegisterMSG) {
      bot.chat(`/register ` + password + " " + password); //Registers if necessary
    }
    if (message.toString() === AfterLoginMSG) {
    } // Bot has joined the server
    if (message.toString() === AfterRegisterMSG) {
    }
    if (message.toString() == HomeCancelMSG) {
      //If the tp request is cancelled
      if (ShouldBotBeKilled == true) {
        bot.chat("/home");
      }
    }
    if (message.toString() == HomeMessage && IsSlashKillAllowed == false) {
      if (ShouldBotBeKilled == true) {
        Suicidio();
      }
    }
  });

  bot.on("whisper", (username, _) => {
    if (username == BotOwner) {
      bot.chat("/home"); //if the bot's owner wants it in the stash
    }
  });

  bot.on("end", () => {
    // Reconnects if the bot gets kicked
    setTimeout(initBot, 5000); // reconnect
  });

  bot.on("error", (err) => {
    console.log(`Unhandled error: ${err}`);
  });
  module.exports.QueueDelivery = QueueDelivery; // Exports the modules for future access in index.js
  module.exports.ObtenerUsuariosEnLinea = ObtenerUsuariosEnLinea;
}
}
module.exports = initBot;
