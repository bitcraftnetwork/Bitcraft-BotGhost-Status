const { Client, GatewayIntentBits, ActivityType } = require("discord.js");
const dotenv = require("dotenv");
dotenv.config();

// Create a new client instance
const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

// Configuration
const CONFIG = {
  TOKEN: process.env.DISCORD_TOKEN,
  STATUS: {
    presence: "online",
    activity: {
      name: "Bitcraft Network's Server",
      type: ActivityType.Watching,
      url: null,
    },
  },
  UPDATE_INTERVAL: 30000,
};

// Function to set bot status
async function updateStatus() {
  try {
    await client.user.setPresence({
      status: CONFIG.STATUS.presence,
      activities: [
        {
          name: CONFIG.STATUS.activity.name,
          type: CONFIG.STATUS.activity.type,
          url: CONFIG.STATUS.activity.url,
        },
      ],
    });
    console.log(`✅ Status updated: ${CONFIG.STATUS.activity.name}`);
  } catch (error) {
    console.error("❌ Error updating status:", error);
  }
}

// Bot ready event
client.once("ready", async () => {
  console.log(`🚀 Bot is ready! Logged in as ${client.user.tag}`);
  console.log(`📊 Serving ${client.guilds.cache.size} servers`);

  // Set initial status
  await updateStatus();

  // Keep a single status updated periodically
  setInterval(updateStatus, CONFIG.UPDATE_INTERVAL);
});

// Error handling
client.on("error", (error) => {
  console.error("❌ Discord client error:", error);
});

// Reconnect handling
client.on("disconnect", () => {
  console.log("🔌 Bot disconnected");
});

client.on("reconnecting", () => {
  console.log("🔄 Bot reconnecting...");
});

// Login to Discord
client.login(CONFIG.TOKEN).catch((error) => {
  console.error("❌ Failed to login:", error);
  process.exit(1);
});

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("🛑 Shutting down bot...");
  client.destroy();
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("🛑 Shutting down bot...");
  client.destroy();
  process.exit(0);
});

