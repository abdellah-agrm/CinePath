const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const os = require("os");

const certDir = path.join(__dirname, "..", "certificates");
const keyPath = path.join(certDir, "localhost-key.pem");
const certPath = path.join(certDir, "localhost.pem");

if (!fs.existsSync(certDir)) {
  fs.mkdirSync(certDir, { recursive: true });
}

// Find local IPv4 address
function getLocalIp() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const net of interfaces[name] || []) {
      if (net.family === "IPv4" && !net.internal && net.address.startsWith("192.168.")) {
        return net.address;
      }
    }
  }
  return "192.168.0.101";
}

const localIp = getLocalIp();

// Try finding OpenSSL
const opensslPaths = [
  "openssl",
  "C:\\Program Files\\Git\\usr\\bin\\openssl.exe",
  "C:\\Program Files (x86)\\Git\\usr\\bin\\openssl.exe",
];

let openssl = null;
for (const p of opensslPaths) {
  try {
    execSync(`"${p}" version`, { stdio: "ignore" });
    openssl = p;
    break;
  } catch {}
}

if (openssl) {
  try {
    const cmd = `"${openssl}" req -x509 -newkey rsa:2048 -keyout "${keyPath}" -out "${certPath}" -days 365 -nodes -subj "/CN=${localIp}" -addext "subjectAltName=DNS:localhost,IP:127.0.0.1,IP:${localIp}"`;
    execSync(cmd, { stdio: "inherit" });
    console.log(`✓ SSL Certificate generated for localhost and ${localIp}`);
  } catch (err) {
    console.warn("Could not generate certificate via OpenSSL:", err.message);
  }
}

