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
} = require("./config.json");
const { GoalNear } = require("mineflayer-pathfinder").goals;
console.log("[Console] Creating bot.");
let isBotBussy = false;
QueueItems = {};
CurrentDeliveryID = "";
const { pathfinder, Movements, goals } = require("mineflayer-pathfinder");
const mineflayerViewer = require("prismarine-viewer").mineflayer;
const GoalBlock = goals.GoalBlock;
let ShouldBotBeKilled = false;
vec3 = require("vec3");

// Argumentos del bot.
const botArgs = {
  host: host, //IP del servidor
  port: port, // Puerto del servidor
  username: username, //Usuario del bot
  version: version, //Version del servidor
};

function initBot() {
  //Inicio bot
  let bot = mineflayer.createBot(botArgs);
  bot.loadPlugin(pathfinder);
  const mcData = require("minecraft-data")(bot.version);
  async function ObtenerUsuariosEnLinea() {
    //Funcion para acceder de forma externa
    return bot.players;
  }

  async function expulsar() {
    await new Promise((resolve) => setTimeout(resolve, TPDelay));
    if (IsSlashKillAllowed == false) {
      //Si el /kill esta desabilitado
      itemindex = 0;
      cantidaditems = bot.inventory.items().length; //Obtiene la cantidad de items en el inventario
      for (var i = 0; i < cantidaditems; i++) {
        //Por cada item que tenga en el inventario:
        await new Promise((resolve) => setTimeout(resolve, 500)); //Delay de 0.5 segundos
        const playerFilter = (entity) => entity.type === "player"; //Busca un jugador para mirarlo
        let player = bot.nearestEntity(playerFilter);
        if (player) {
          bot.lookAt(player.position.offset(0, player.height, 0));
        }
        if (bot.inventory.items()[itemindex] != undefined) {
          //Si el item con el indice actual existe en el inventario
          if (bot.inventory.items()[itemindex].count == 1) {
            try {
              item = bot.inventory.items()[itemindex].slot; //Obtiene el slot del item
              bot.clickWindow(item, 0, 4); //Con las apis de bajo nivel tira el item utilizando el slot
            } catch {
              continue;
            }
          } else {
            itemindex++; //Se suma uno al indice para el siguiente item, asi por todos los items
          }
        }
      }
      bot.chat("/home"); //Se envia el comando Home para retornar a base, se espera un timeout
      await new Promise((resolve) => setTimeout(resolve, HomeDelay));
    } else {
      bot.chat("/kill");
    }
  }

  async function Suicidio() {
    const defaultMove = new Movements(bot); //Se crea un nuevo tipo de movimiento para el bot
    defaultMove.blocksToAvoid.delete(mcData.blocksByName.lava.id); //Este movimiento no le tiene miedo a la lava
    bot.pathfinder.setMovements(defaultMove);
    bot.pathfinder.setGoal(
      new GoalNear(LavaCoords[0], LavaCoords[1], LavaCoords[2], 2)
    ); //Se mueve a la lava para matar al bot
    ShouldBotBeKilled = false;
  }

  async function QueueDelivery(items, usuario, RequestID) {
    //Funcion accesada remotamente, agrega datos a una lista, contiene el usuario y un array de items
    QueueItems[RequestID] = { Usuario: usuario, Items: items };
  }

  function setBussyStatus(estado) {
    isBotBussy = estado; //Esta funcion no es necesaria, pero la preferi porque daba errores al simplemente hacerlo de forma externa
  }

  function HandleDelivery() {
    if (Object.keys(QueueItems).length > 0 && isBotBussy == false) {
      //Si el bot no esta ocupado en otro envio y la cola de items es mayor que 0 envia el delivery y lo pone como envio actual
      SendDelivery(
        QueueItems[Object.keys(QueueItems)[0]].Items,
        QueueItems[Object.keys(QueueItems)[0]].Usuario,
        Object.keys(QueueItems)[0]
      );
      CurrentDeliveryID = Object.keys(QueueItems)[0]; //Se pone el id del delivery como el actual
    }
  }
  async function SendDelivery(identificador, usuario, RequestID) {
    setBussyStatus(true); //Pone el bot en estado ocupado
    bot.once("death", () => {
      //Cuando el bot muera reestablece valores importantes para evitar bugs, el once hace que solo se ejecute una vez y no sea constante
      ShouldBotBeKilled = false;
      delete QueueItems[RequestID];
      setBussyStatus(false);
    });
    const movements = new Movements(bot, mcData); //Crea movimientos, pero esta vez con bloques que no se deben romper
    movements.blocksCantBreak.add(mcData.blocksByName.diamond_block.id);
    movements.blocksCantBreak.add(mcData.blocksByName.sandstone.id);
    movements.blocksCantBreak.add(mcData.blocksByName.wither_skeleton_skull.id);
    movements.blocksCantBreak.add(mcData.blocksByName.chest.id);
    movements.blocksCantBreak.add(mcData.blocksByName.cobblestone.id);
    movements.blocksCantBreak.add(mcData.blocksByName.glass.id);
    movements.blocksCantBreak.add(mcData.blocksByName.beacon.id);
    movements.scafoldingBlocks = [];
    bot.pathfinder.setMovements(movements); //Adopta el movimiento
    ShouldBotBeKilled = true; //El bot a partir de aqui debe de suicidarse si o si
    for (var i = 0; i < identificador.length; i++) {
      const Skull = bot.findBlock({
        //Skull es el bloque kit que buscamos, entonces se va a dirigir a el bloque
        matching: identificador[i],
        maxDistance: 128,
      });

      if (!Skull) {
        //En caso de que no encuentre el bloque va a cancelar el envio y va a enviar un mensaje
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
        setBussyStatus(false);
        return;
      }

      //En caso de que si la encuentre se va a dirijir
      var x = Skull.position.x;
      var y = Skull.position.y;
      var z = Skull.position.z + 1;
      var goal = new GoalBlock(x, y, z);
      await bot.pathfinder.goto(goal);
      const chest = bot.findBlock({
        //Encuentra un cofre que tiene que estar al lado del bloque representativo del kit
        matching: mcData.blocksByName.chest.id,
        maxDistance: 2,
      });

      if (!chest) {
        //Si no lo encuentra cancela el envio
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
        setBussyStatus(false);
        return;
      }
      var x = chest.position.x;
      var y = chest.position.y;
      var z = chest.position.z;
      let chest_window = await bot.openChest(bot.blockAt(vec3(x, y, z))); //Abre el cofre que acaba de localizar
      items = chest_window.containerItems(); //Obtiene los items
      if (items.length == 0) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        bot.chat(
          "/msg " +
            usuario +
            " " +
            UnstockedItemMessage.replaceAll(
              "{{RequestID}}",
              RequestID
            ).replaceAll("{{User}}", usuario)
        ); //Si no hay items envia un mensaje que dice que no esta en stock
        bot.closeWindow(chest_window);
      } else {
        //En caso de que si encuentre el kit lo va a sacar del cofre
        await chest_window.withdraw(items[0].type, null, 1);
        bot.closeWindow(chest_window);
        index = 1;
        await new Promise((resolve) => setTimeout(resolve, 2000)); //Espera 2 segundos para recoger el item
        while (bot.inventory.items().length == 0) {
          await new Promise((resolve) => setTimeout(resolve, 100));
          index = index + 1;
        }
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 2000)); //Delay de 2 segundos antes de enviar tp
    bot.chat(
      "/msg " +
        usuario +
        " " +
        AcceptTPASK.replaceAll("{{RequestID}}", RequestID)
          .replaceAll("{{User}}", usuario)
          .replaceAll("{{TPAcceptTime}}", TPAcceptTime / 1000)
    );
    bot.chat("/tpa " + usuario); //Envia tp
    let teleportAccepted = false;
    timeoutId = setTimeout(() => {
      //Si pasa TPAcceptTime y el usuario no acepta tp se cancela y el bot se suicida
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
      timeoutId = null; // Para indicar que el timeout ya se ha ejecutado
    }, TPAcceptTime);

    bot.on("message", (message) => {
      if (
        message == UTPAcceptMSG.replaceAll("{{User}}", usuario) &&
        !teleportAccepted
      ) {
        //Si el usuario acepta la solicitud de teletransporte
        teleportAccepted = true;
        expulsar();
        clearTimeout(timeoutId); //Elimina el temporizador de 10sg para aceptar
        return "[OK] El delivery se completo sin ningun percance"; //Acaba la funcion
      }

      if (message == UTPCancelMSG.replaceAll("{{User}}", usuario)) {
        //Si el usuario rechaza
        if (ShouldBotBeKilled) {
          Suicidio(); //Mata el bot
        }
        ShouldBotBeKilled = false;
        delete QueueItems[RequestID];
        setBussyStatus(false);
        clearTimeout(timeoutId);
        return "[X]" + usuario + " Cancelo la solicitud";
      }
    });
  }

  // Carga mineflayer

  bot.once("spawn", () => {
    mineflayerViewer(bot, { port: 8080, firstPerson: true });
    setInterval(HandleDelivery, 2000); //Ejecuta la funcion que se encarga de verificar los envios cada 2 segundos
  });

  bot.on("message", (message) => {
    // logs login
    console.log(message.toString());
    if (message.toString() === LoginMSG) {
      bot.chat(`/login ` + password); //Inicia sesion
    }
    if (message.toString() === RegisterMSG) {
      bot.chat(`/register ` + password + " " + password); //Registra el bot
    }
    if (message.toString() === AfterLoginMSG) {
    } // Bot has joined the server
    if (message.toString() === AfterRegisterMSG) {
    }
    if (message.toString() == HomeCancelMSG) {
      //Si la peticion de teletransporte se cancela
      if (ShouldBotBeKilled == true) {
        bot.chat("/home");
      }
    }
    if (message.toString() == HomeMessage) {
      if (ShouldBotBeKilled == true) {
        Suicidio(CurrentDeliveryID);
      }
    }
  });

  bot.on("whisper", (username, message) => {
    if (username == BotOwner) {
      bot.chat("/home"); //Si la persona que envia el mensaje es el dueño se dirige al stash
    }
  });

  bot.on("end", () => {
    // RECONECTAR POR SI BOT ES KICKEADO
    setTimeout(initBot, 5000); // reconnect
  });

  bot.on("error", (err) => {
    console.log(`Unhandled error: ${err}`);
  });
  module.exports.QueueDelivery = QueueDelivery; // Se exportan modulos para su futuro acceso desde Index.js
  module.exports.ObtenerUsuariosEnLinea = ObtenerUsuariosEnLinea;
}
module.exports = initBot;
