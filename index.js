// index.js
const { Client, GatewayIntentBits, ActivityType } = require("discord.js");
const dotenv = require("dotenv");

// Load environment variables
dotenv.config();

// Validate required environment variables
if (!process.env.DISCORD_TOKEN) {
  console.error("❌ DISCORD_TOKEN environment variable is required");
  process.exit(1);
}

// Create a new client instance
const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

// Configuration
const CONFIG = {
  TOKEN: process.env.DISCORD_TOKEN,
  STATUS: {
    presence: process.env.BOT_PRESENCE || "online",
    activity: {
      name: process.env.BOT_ACTIVITY_NAME || "Bitcraft Network's Server",
      type:
        ActivityType[process.env.BOT_ACTIVITY_TYPE] || ActivityType.Watching,
      url: process.env.BOT_ACTIVITY_URL || null,
    },
  },
  UPDATE_INTERVAL: parseInt(process.env.UPDATE_INTERVAL) || 30000,
  PORT: process.env.PORT || 3000, // For platforms like Heroku
};

// Health check endpoint for deployment platforms
const express = require("express");
const app = express();

app.get("/", (req, res) => {
  res.json({
    status: "online",
    botStatus: client.user ? "ready" : "connecting",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

app.get("/health", (req, res) => {
  res.status(200).json({ status: "healthy" });
});

// Start HTTP server for deployment platforms
const server = app.listen(CONFIG.PORT, () => {
  console.log(`🌐 Health check server running on port ${CONFIG.PORT}`);
});

// Function to set bot status
async function updateStatus() {
  try {
    if (!client.user) {
      console.log("⏳ Bot not ready yet, skipping status update");
      return;
    }

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
    console.log(
      `✅ Status updated: ${
        CONFIG.STATUS.activity.name
      } | ${new Date().toISOString()}`
    );
  } catch (error) {
    console.error("❌ Error updating status:", error);
  }
}

// Bot ready event
client.once("ready", async () => {
  console.log(`🚀 Bot is ready! Logged in as ${client.user.tag}`);
  console.log(`📊 Serving ${client.guilds.cache.size} servers`);
  console.log(`🔧 Environment: ${process.env.NODE_ENV || "development"}`);

  // Set initial status
  await updateStatus();

  // Keep a single status updated periodically
  setInterval(updateStatus, CONFIG.UPDATE_INTERVAL);
});

// Error handling with better logging
client.on("error", (error) => {
  console.error("❌ Discord client error:", error.message);
  console.error("Stack trace:", error.stack);
});

client.on("warn", (warning) => {
  console.warn("⚠️ Discord client warning:", warning);
});

// Reconnect handling
client.on("disconnect", () => {
  console.log("🔌 Bot disconnected");
});

client.on("reconnecting", () => {
  console.log("🔄 Bot reconnecting...");
});

client.on("resume", () => {
  console.log("✅ Bot connection resumed");
});

// Rate limit handling
client.on("rateLimit", (rateLimitData) => {
  console.warn("⚠️ Rate limit hit:", rateLimitData);
});

// Login to Discord with retry logic
async function connectBot() {
  try {
    await client.login(CONFIG.TOKEN);
    console.log("✅ Successfully logged in to Discord");
  } catch (error) {
    console.error("❌ Failed to login:", error.message);

    // Retry after 5 seconds
    setTimeout(() => {
      console.log("🔄 Retrying connection...");
      connectBot();
    }, 5000);
  }
}

// Start the bot
connectBot();

// Graceful shutdown
function gracefulShutdown(signal) {
  console.log(`🛑 Received ${signal}, shutting down gracefully...`);

  // Stop accepting new connections
  server.close(() => {
    console.log("🌐 HTTP server closed");
  });

  // Destroy Discord client
  if (client) {
    client.destroy();
    console.log("🤖 Discord client destroyed");
  }

  process.exit(0);
}

process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  console.error("💥 Uncaught Exception:", error);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("💥 Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});

// Keep the process alive
process.stdin.resume();
