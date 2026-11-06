# ⚔️ KAY X BOT

A WhatsApp bot (JavaScript + [Baileys](https://github.com/WhiskeySockets/Baileys)) with a Shadow Monarch menu and a **web page where anyone can connect their own WhatsApp with just a phone number and a pairing code**.

- 10 menus: General, AI, Games, Anime, Stickers & Images, Downloaders, Group Management, Search, Utilities, Owner
- The menu is sent as a picture. In groups it sometimes uses the group's own picture
- Each connected number is its own bot with its own owner and settings
- Reconnects by itself and stays connected until the person unlinks it in WhatsApp
- Adding a command = adding one small file in `commands/<category>/`

> Only commands that really work are listed. Menus that have no commands yet say "Coming soon".

## Run it on your phone (Termux)

```bash
pkg update -y && pkg install nodejs-lts git ffmpeg -y
git clone https://github.com/YOUR-USERNAME/KAY-X-BOT.git
cd KAY-X-BOT
npm install
```

Open `config.js` and put your number in `owners` (country code, no `+`), then:

```bash
node index.js
```

A `PAIRING CODE:` appears. In WhatsApp: **Settings → Linked devices → Link a device → Link with phone number instead**, and type the code.

## Let other people connect (web pairing page)

Run the bot on a server. The pairing page is the root URL of that server, for example `https://your-app.example.com`.
Visitors first choose **Pairing code** (type number, get an 8-character code) or **QR code** (scan from another device), then their bot is live.

Options (check each host's current free-plan terms, they change often):

| Where | Good | Watch out for |
|---|---|---|
| A VPS or an always-free cloud VM | Real 24/7 uptime, disk survives restarts | Setup work. Use `pm2 start index.js --name kay` so it restarts after a reboot |
| Docker-based hosts (use the included `Dockerfile`) | Easy deploy from GitHub | Many free plans sleep when idle and wipe the disk on redeploy, so everyone has to link again |
| Termux on a phone | Free | Only online while the phone and Termux stay running |

Free hosts that sleep: point an uptime pinger at `/health` every 5 minutes. If the disk is wiped on redeploy, linked numbers are lost, so use a host with a persistent disk for `sessions/`.

### Settings (environment variables or `config.js`)

| Name | Meaning | Default |
|---|---|---|
| `OWNER_NUMBER` | Your own number (optional) | placeholder |
| `PORT` | Web page port (hosts set this for you) | 3000 |
| `MAX_SESSIONS` | How many numbers one server hosts | 20 |
| `BOT_NAME`, `PREFIX`, `MODE` | Name, command prefix, `public` or `private` | KAY X BOT, `.`, public |
| `BOT_TIMEZONE` | Time shown in the menu | Africa/Lagos |
| `PAIR_URL` | Your pairing page address, shown in `.ping` (or set it in WhatsApp with `.setlink`) | none |
| `WEB=off` | Turn the web page off | on |

## Unlinking

On the phone: **WhatsApp → Linked devices → tap the device → Log out**. The bot notices and deletes that login from the server.

## Important

- This uses WhatsApp's unofficial Web protocol. WhatsApp can restrict numbers that use bots, so do not use your main number for anything you cannot afford to lose.
- Whoever runs the server holds the login data of everyone who connects. Only host for people you trust, keep `sessions/` private, and never put it on GitHub (it is already in `.gitignore`).
- Pairing requests are limited to 5 per 10 minutes per visitor, and `MAX_SESSIONS` caps the number of hosted logins.

## Add a command

Create `commands/utility/hello.js`:

```js
module.exports = {
  name: "hello",
  desc: "Say hello",
  async run({ reply }) {
    await reply("Hello, Hunter.");
  },
};
```

Restart the bot. It appears under the UTILITIES menu by itself. The folder name decides the menu: `general`, `ai`, `games`, `anime`, `sticker`, `downloader`, `group`, `search`, `utility`, `owner`.
Useful options on a command: `aliases: ["hi"]`, `ownerOnly: true`, `groupOnly: true`.

## Your own menu pictures

Put `.jpg` or `.png` files in `media/`. The menu picks one at random. With none of your own, it uses `media/default.jpg`.
