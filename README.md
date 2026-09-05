# FPL Ballknower

A small browser extension that adds extra detail to the [Fantasy Premier League](https://fantasy.premierleague.com) mini-league standings page:

- **Transfers made** this gameweek, shown under each manager's name (with a hover tooltip if they made more than 4 — handy for wildcard/free hit weeks)
- **Free transfers remaining** and **points lost to hits**, estimated per manager
- **Highlight filter** — pick any player from your league and a filter (Owned / Captained / Benched / Started) to instantly see which teams match

It works entirely in your browser. No login, no data collection, no server — it just reads the same public FPL data your browser already has access to and adds it to the page.

## Screenshots

*(add a screenshot or two here once you've got one you like)*

## Installation

### Firefox

FPL Ballknower is signed by Mozilla, so installing it is a completely normal, permanent install — no developer settings needed.

1. Download the latest `.xpi` file from this repo's [Releases page](../../releases).
   - **Note:** clicking a `.xpi` link in Firefox normally triggers an install prompt directly (rather than downloading a file) — that's fine and expected, just click through it. If you specifically want to save the file first, right-click the link and choose "Save Link As…" instead.
2. If you downloaded the file rather than installing directly, drag the `.xpi` file into a Firefox window.
3. Click **Add** on the prompt that appears.
4. Done — it's installed permanently, just like any add-on from the official store.

### Tampermonkey (works in Firefox, Chrome, Edge, Brave, etc.)

If you don't want to install a dedicated extension, the same functionality is available as a userscript for [Tampermonkey](https://www.tampermonkey.net/), which works across basically every browser.

1. Install the Tampermonkey extension for your browser from the link above.
2. Click the Tampermonkey icon in your toolbar → **Create a new script**.
3. Delete the placeholder content and paste in the contents of [`content.js`](./content.js) from this repo, wrapped with a userscript header like this at the very top:

   ```javascript
   // ==UserScript==
   // @name         FPL Ballknower
   // @namespace    fpl-ballknower
   // @version      1.0
   // @description  Transfers, free transfers, hits, and player highlight filters for FPL mini-leagues
   // @match        https://fantasy.premierleague.com/*leagues/*/standings/*
   // @grant        none
   // ==/UserScript==
   ```

4. Save (Ctrl+S / Cmd+S).
5. Go to any FPL mini-league standings page and reload — it should just work.

### Chrome / Edge / Brave (and other Chromium browsers)

**Not currently available.** FPL Ballknower isn't published on the Chrome Web Store yet. In the meantime, Chromium-browser users can use the [Tampermonkey option](#tampermonkey-works-in-firefox-chrome-edge-brave-etc) above, which works identically.

## How to find your league

Once installed (extension or userscript), just browse to your mini-league's standings page as normal:
`fantasy.premierleague.com/leagues/<your-league-id>/standings/c`

It activates automatically on any page matching that pattern — no setup or configuration needed.

## Updating

- **Firefox extension:** check the [Releases page](../../releases) for newer versions; install the new `.xpi` the same way as above.
- **Tampermonkey:** re-copy the latest `content.js` into your existing script via Tampermonkey's dashboard.

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
