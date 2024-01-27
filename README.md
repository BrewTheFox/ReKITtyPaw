<p align="center">
  <img src="https://github.com/BrewTheFox/ReKITtyPaw/blob/main/images/rainbow-color.gif?raw=true" alt="ReKITtyPaw" width="100%", =50%>
</p>

<h1 align="center">
  ReKITtyPaw
</h1>

<p align="center">
  <img src="https://github.com/BrewTheFox/ReKITtyPaw/blob/main/images/Shulker.gif?raw=true" alt="ReKITtyPaw" width="10%">
</p>


<p align="center">
  <img src="https://github.com/BrewTheFox/ReKITtyPaw/blob/main/images/rainbow-color.gif?raw=true" alt="ReKITtyPaw" width="100%">
</p>

## What is this?
#### ReKITtyPaw is a Minecraft bot designed to simplify the setup of kit delivery bots in anarchy servers. Developed in JavaScript using the Mineflayer library, ReKITtyPaw aims to simplify the configuration process through an easy-to-use JSON file.

## Key Features:

- #### Easy to configure.
- #### Compatible with almost* any server.
- #### Made to be used together with discord.

## How to install:
- #### First of all clone the git repository of the project with this command:

```bash
git clone https://github.com/BrewTheFox/ReKITtyPaw.git ./ReKittyPaw
```

- #### Then change the directory to ReKittyPaw:


```bash
cd ReKittyPaw
```

- #### Install the project dependencies:


```node
npm install
```

## How to configure:
#### After you have installed the project, you should configure it in the file ./config.json. There are some important things to take into consideration.

- ## Keywords
  | **Keyword**      | **Replaced With**                                                     |
  |------------------|-----------------------------------------------------------------------|
  | {{User}}         | The minecraft username of the person that requested the delivery.     |
  | {{TPAcceptTime}} | The time that you've set on TPAcceptTime converted to seconds.        |
  | {{RequestID}}    | A randomly generated uuid generated after the user requested the kit. |
