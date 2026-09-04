# FPL Mini-League Extras

A small browser extension that adds extra detail to the [Fantasy Premier League](https://fantasy.premierleague.com) mini-league standings page:

- **Transfers made** this gameweek, shown under each manager's name (with a hover tooltip if they made more than 4 — handy for wildcard/free hit weeks)
- **Free transfers remaining** and **points lost to hits**, estimated per manager
- **Highlight filter** — pick any player from your league and a filter (Owned / Captained / Benched / Started) to instantly see which teams match

It works entirely in your browser. No login, no data collection, no server — it just reads the same public FPL data your browser already has access to and adds it to the page.

## Screenshots

*(add a screenshot or two here once you've got one you like)*

## Installation

This isn't published on the Chrome Web Store or Firefox Add-ons store — you install it directly from this repo. Takes about a minute.

### Firefox

1. Download this repo: click the green **Code** button above → **Download ZIP**, then unzip it somewhere.
2. Open Firefox and go to `about:debugging#/runtime/this-firefox`
3. Click **Load Temporary Add-on…**
4. Select the `manifest.json` file inside the unzipped folder.
5. Done — go to any of your FPL mini-league standings pages and it should just work.

**Heads up:** Firefox removes "temporary" add-ons when you restart the browser, so you'll need to repeat steps 2–4 each time you restart Firefox. If that gets annoying, there's a way to get a permanently-signed version — see [Notes for Firefox permanence](#notes-for-firefox-permanence) below.

### Chrome (also works for Edge, Brave, and other Chromium browsers)

1. Download this repo: click the green **Code** button above → **Download ZIP**, then unzip it somewhere.
2. Open Chrome and go to `chrome://extensions`
3. Turn on **Developer mode** (top-right toggle).
4. Click **Load unpacked**.
5. Select the unzipped folder (the one containing `manifest.json`).
6. Done — this one *does* stay installed permanently, as long as Developer mode stays on and you don't delete the folder (Chrome loads the extension from that folder each time, it doesn't copy it).

## How to find your league

Once installed, just browse to your mini-league's standings page as normal:
`fantasy.premierleague.com/leagues/<your-league-id>/standings/c`

The extension activates automatically on any page matching that pattern — no setup or configuration needed.

## Updating

Since this isn't on an extension store, updates don't happen automatically. To get the latest version:

1. Download the new ZIP from this repo (or `git pull` if you cloned it).
2. **Firefox:** repeat the "Load Temporary Add-on" steps.
3. **Chrome:** go to `chrome://extensions`, find the extension, and click the refresh/reload icon — no need to remove and re-add it, as long as it's pointing at the same folder you just updated.

## Notes for Firefox permanence

Firefox requires extensions to be signed by Mozilla to install permanently, even for private use — this is a Firefox platform restriction, not something specific to this extension. If you want to skip re-loading it after every restart, you (or whoever maintains this repo) can submit it for signing at [addons.mozilla.org/developers](https://addons.mozilla.org/developers/) as an **unlisted** add-on. That skips public store review and just hands back a signed `.xpi` file, which installs permanently and isn't searchable by anyone else. This is free and only needs to be done once per version.

## What data does this use?

Everything comes from Fantasy Premier League's own public API — the same data your browser already loads when you view the standings page. Specifically:

- `bootstrap-static/` — player names and positions
- `entry/{id}/transfers/` — a manager's transfer history
- `entry/{id}/history/` — a manager's gameweek-by-gameweek history (for the free-transfer and hits estimate)
- `entry/{id}/event/{gw}/picks/` — a manager's squad for a given gameweek

No data is sent anywhere else, stored, or tracked. Nothing leaves your browser except the requests to FPL's own API that the page would need anyway.

## Known limitations

- **Free transfers remaining is an estimate**, not official — the FPL API doesn't expose this number directly, so it's calculated by replaying each gameweek's transfer count and chip usage against FPL's known banking rules. It should be accurate for the vast majority of cases, but if it ever looks off for a specific manager, that's useful to know about (see [Issues](../../issues)).
- Wildcard/Free Hit weeks can log a lot of intermediate transfer edits in FPL's data (e.g. swapping a player out and back in while building a squad) — this extension nets those out and matches players by position where possible, but very rarely (when a wildcard changes formation shape) it may pair up two different positions.
- Built and tested against the FPL site's current page structure — if FPL redesigns their standings page, the extension may stop finding the table until it's updated.

## Contributing / issues

Found a bug or have a feature idea? Open an [issue](../../issues) on this repo.
