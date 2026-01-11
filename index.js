import makeWASocket, { useMultiFileAuthState } from "@adiwajshing/baileys";
import Pino from "pino";

const config = {
  prefix: "!",
  admins: [
    "2349060611185@s.whatsapp.net",
    "2349162258348@s.whatsapp.net"
  ],
  botName: "NuelSuperBot",
  description: "Best bot ever — fast, smart, unstoppable 💥",
  autoRead: true
};

const logger = Pino({ level: "warn" });

// 🟢 Registry of 99+ commands
const commands = {
  help: { run: async ({ sock, jid }) => await sock.sendMessage(jid, { text: "📜 Commands:\n" + Object.keys(commands).join(", ") }) },
  ping: { run: async ({ sock, jid }) => await sock.sendMessage(jid, { text: "pong 🏓" }) },
  echo: { run: async ({ sock, jid, args }) => await sock.sendMessage(jid, { text: args.join(" ") || "Say something after !echo" }) },
  info: { run: async ({ sock, jid }) => await sock.sendMessage(jid, { text: `${config.botName} online.\n${config.description}` }) },
  joke: { run: async ({ sock, jid }) => await sock.sendMessage(jid, { text: "😂 Joke (stub)" }) },
  quote: { run: async ({ sock, jid }) => await sock.sendMessage(jid, { text: "💬 Quote (stub)" }) },
  dice: { run: async ({ sock, jid }) => await sock.sendMessage(jid, { text: `🎲 ${Math.floor(Math.random() * 6) + 1}` }) },
  kick: { adminOnly: true, run: async ({ sock, jid, args }) => await sock.sendMessage(jid, { text: "🚫 Kick (stub)" }) },
  promote: { adminOnly: true, run: async ({ sock, jid, args }) => await sock.sendMessage(jid, { text: "👑 Promote (stub)" }) },
  channel: { run: async ({ sock, jid }) => await sock.sendMessage(jid, { text: "📢 Join our channel:\nhttps://whatsapp.com/channel/0029VbC13vq2Jl85e6pAOI32" }) },
  logo: { run: async ({ sock, jid }) => await sock.sendMessage(jid, { image: { url: "./assets/bot.jpg" }, caption: "🔥 NuelSuperBot" }) },
  // … continue adding stubs until you reach 99+ commands
};

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("./auth");
  const sock = makeWASocket({
    logger,
    printQRInTerminal: true,
    auth: state,
    browser: ["NuelSuperBot", "Chrome", "10.0"]
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("messages.upsert", async ({ messages }) => {
    const m = messages[0];
    if (!m.message || m.key.fromMe) return;

    const jid = m.key.remoteJid;
    const senderJid = m.key.participant || m.key.remoteJid;
    const text = m.message.conversation || m.message.extendedTextMessage?.text || "";

    if (!text.startsWith(config.prefix)) return;

    const args = text.slice(config.prefix.length).trim().split(/\s+/);
    const cmdName = args.shift().toLowerCase();
    const cmd = commands[cmdName];
    if (!cmd) return;

    if (cmd.adminOnly && !config.admins.includes(senderJid)) {
      return sock.sendMessage(jid, { text: "🚫 Admins only." });
    }

    try {
      await cmd.run({ sock, jid, senderJid, args, config });
    } catch (e) {
      logger.error(e);
      await sock.sendMessage(jid, { text: "❌ Error: " + e.message });
    }
  });

  sock.ev.on("connection.update", (u) => {
    if (u.connection === "open") logger.info("✅ NuelSuperBot connected.");
    if (u.connection === "close") logger.warn("❌ Connection closed.");
  });
}

startBot();
