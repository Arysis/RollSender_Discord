require("dotenv").config();
const { Client, GatewayIntentBits } = require("discord.js");
const fetch = require("node-fetch");

// Création du client avec les intents nécessaires
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ],
});

const API_URL = process.env.API_URL;
const CHANNEL_ID = process.env.DISCORD_CHANNEL_ID;
const POLL_INTERVAL_MS = Number(process.env.POLL_INTERVAL_MS || 10000);

let lastDataHash = null

async function pollApiAndSend() {
  try {
    const res = await fetch(API_URL);
    if (!res.ok) {
      console.error("Erreur HTTP API:", res.status, await res.text());
      return;
    }

    const data = await res.json();

    const dice = data.dice;
    const currentHash = JSON.stringify(data.id);
    if (currentHash === lastDataHash) {
      return;
    }
    lastDataHash = currentHash;

    const channel = await client.channels.fetch(CHANNEL_ID);
    if (!channel) {
      console.error("Channel introuvable:", CHANNEL_ID);
      return;
    }

    let somme = 0;
    const parts = dice.map(d => {
      const type = d.type;
      const value = d.value;
      somme += value;
      return `${type}: ${value}`;
    });

    const message = parts.join(", ");
    
    // Formate le message comme tu veux
    await channel.send(`\`\`\`md
# ${somme}
Details:[${message}]
\`\`\``);
  } catch (err) {
    console.error("Erreur lors de l'appel API:", err);
  }
}

// Événement : le bot est prêt
client.once("ready", () => {
  console.log(`✅ Connecté en tant que ${client.user.tag}`);

  // Lancement de la boucle
  if (!API_URL || !CHANNEL_ID) {
    console.error("⚠️ API_URL ou DISCORD_CHANNEL_ID manquant dans .env");
    return;
  }

  console.log(`⏱️ Démarrage du poll toutes les ${POLL_INTERVAL_MS} ms`);
  setInterval(pollApiAndSend, POLL_INTERVAL_MS);
});

// Événement : nouveau message
client.on("messageCreate", (message) => {
  // Ignore les messages des autres bots
  if (message.author.bot) return;

  // Commande simple: !ping
  if (message.content === "!ping") {
    message.channel.send("Pong!");
  }
});

// Connexion avec le token
client.login(process.env.DISCORD_TOKEN);