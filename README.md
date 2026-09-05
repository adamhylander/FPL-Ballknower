# FPL Ballknower

A browser extension for Fantasy Premier League mini-league standings. Adds:

- Each manager's transfers for the current gameweek (hover for full list if they made more than 4)
- Estimated free transfers remaining and points lost to hits
- A player filter with dropdowns for Owned / Captained / Benched / Started, which highlights matching teams in the table

Runs entirely in your browser. No login, no tracking, no server. It just reads the same public FPL API data your browser already loads.

## Pictures
Example league showing transfers, remaining free hits and if the player has taken any hits (-4):

<img width="1360" height="842" alt="bild" src="https://github.com/user-attachments/assets/b507cd25-5b8b-43fc-8e53-50fae4c019f0" />

A really shit wildcard usage:

<img width="506" height="278" alt="bild" src="https://github.com/user-attachments/assets/be8dd876-ee34-4efd-a0de-f74265a1f062" />


## Installation

### Firefox

Signed by Mozilla, so it installs and stays installed like any normal add-on.

1. Grab the latest `.xpi` from [Releases](../../releases).
2. Clicking the link in Firefox will prompt an install directly. If you want to save the file first instead, right-click the link and choose "Save Link As…".
3. If you downloaded it, drag the `.xpi` into a Firefox window.
4. Click Add.

### Chrome / Edge / Brave

Brother I am not paying 25 dollars to upload this shit on the Chrome Web Store. If you insist on using a Chromium browser and don't wish to use Tampermonkey then you can install manually instead:

1. Download the zip from [Releases](../../releases) and unzip it somewhere you won't delete.
2. Go to `chrome://extensions` (or the equivalent for your browser).
3. Turn on Developer mode.
4. Click Load unpacked, select the unzipped folder.

It'll keep working as long as you don't move or delete that folder.

### Tampermonkey

Works the same in any browser if you'd rather not install a dedicated extension.

1. Install [Tampermonkey](https://www.tampermonkey.net/).
2. Tampermonkey icon → Create a new script.
3. Delete the placeholder, paste in [`content.js`](./content.js), and add this header at the top:

   ```javascript
   // ==UserScript==
   // @name         FPL Ballknower
   // @namespace    fpl-ballknower
   // @version      1.0
   // @match        https://fantasy.premierleague.com/*leagues/*/standings/*
   // @grant        none
   // ==/UserScript==
   ```

4. Save. Reload your league standings page.

## Usage

Just open your mini-league standings page as normal:
`fantasy.premierleague.com/leagues/<league-id>/standings/c`

It runs automatically on any page matching that URL pattern.

## Updating

- Firefox: check [Releases](../../releases) for a newer `.xpi`.
- Chrome/Edge/Brave: re-download and re-unzip, then hit the reload icon on `chrome://extensions`.
- Tampermonkey: paste the updated `content.js` into your existing script.

## Data used

All from FPL's public API:

- `bootstrap-static/` — player names and positions
- `entry/{id}/transfers/` — transfer history
- `entry/{id}/history/` — gameweek history (used for the free transfer / hits estimate)
- `entry/{id}/event/{gw}/picks/` — squad for a gameweek

Nothing is sent anywhere else or stored.

## Known limitations

- Free transfers remaining is an estimate, not official data. FPL's API doesn't expose it, so it's calculated by replaying transfer counts and chip usage against the known banking rules. Should be right almost always, but flag it in [Issues](../../issues) if it's ever wrong for someone.
- Wildcard/Free Hit weeks can log a lot of intermediate transfer edits (swapping a player out and back in while building a squad). This gets netted out and matched by position, but a wildcard that changes formation shape can very rarely produce a mismatched pair.
- Built against FPL's current page structure. If they redesign the standings page, this will probably break until updated.

## Issues

Bugs or feature requests: open an [issue](../../issues).
