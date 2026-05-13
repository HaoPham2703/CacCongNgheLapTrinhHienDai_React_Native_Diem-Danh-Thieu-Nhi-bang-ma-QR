const mongoose = require("mongoose");

async function connectDatabase(connectionString) {
  mongoose.set("strictQuery", true);

  try {
    await mongoose.connect(connectionString, {
      family: 4,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
  } catch (error) {
    const message = String(error?.message || "");

    if (message.includes("querySrv ETIMEOUT") || message.includes("ENOTFOUND")) {
      console.error(
        "MongoDB DNS lookup failed. Check DNS settings (8.8.8.8/1.1.1.1), network firewall, or use a non-SRV URI temporarily.",
      );
    } else if (message.includes("IP that isn't whitelisted")) {
      console.error(
        "MongoDB Atlas rejected network access. Add your current public IP in Atlas Network Access.",
      );
    } else if (message.includes("TLS") || message.includes("SSL")) {
      console.error(
        "MongoDB TLS handshake failed. Check VPN/proxy/firewall interception and Atlas TLS settings.",
      );
    }

    throw error;
  }
}

module.exports = connectDatabase;
