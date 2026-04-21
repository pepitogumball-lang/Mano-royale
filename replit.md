# Mano Royale — Minecraft Bedrock Add-on

## Overview
Mano Royale is a **Minecraft Bedrock Edition add-on** that turns the offhand into a universal action slot. Any item placed in the offhand can be eaten, placed, used, lit (torch) or swapped through a single trigger. Detection of the item type is automatic and works with **all** vanilla items (and most modded items) because it inspects components at runtime instead of using a fixed list.

## Behavior
- **Trigger item** `manoroyale:trigger` — use to perform the offhand action; sneak+use to cycle modes (`auto / eat / place / use / swap`).
- Commands: `/function manoroyale:give`, `/function manoroyale:action`, `/function manoroyale:cycle`, `/function manoroyale:swap`.
- Script events: `/scriptevent manoroyale:action @s`, `manoroyale:cycle`, `manoroyale:swap`, `manoroyale:give`.
- HUD action bar shows what's in the offhand and the detected action.
- Custom `manoroyale:offhand_torch` emits dynamic light when held.

## Stack & Compatibility
- Script API: `@minecraft/server` `1.7.0`.
- `min_engine_version`: `1.20.50` — works on Windows, Android (32/64), iOS, Xbox, Switch.
- Pure JS / JSON; no native compilation.

## Project Structure
```
behavior_pack/
  manifest.json
  pack_icon.png
  scripts/main.js          # main logic
  items/{trigger,offhand_torch}.json
  functions/{action,cycle,swap,give}.mcfunction
resource_pack/
  manifest.json
  pack_icon.png
  textures/item_texture.json
  textures/items/{offhand_torch,mr_trigger}.png
  texts/{languages.json,en_US.lang,es_ES.lang,es_MX.lang}
  ui/hud_screen.json
scripts/gen_textures.js    # procedurally creates all PNG assets
server.js                  # Replit landing/download server
build/                     # produced .mcaddon and .mcpack files
.github/workflows/build.yml # GH Actions build pipeline
```

## Build Commands
```bash
node scripts/gen_textures.js      # (re)generate PNGs
mkdir -p build
(cd behavior_pack && zip -qr ../build/mano-royale-BP.mcpack .)
(cd resource_pack && zip -qr ../build/mano-royale-RP.mcpack .)
mkdir -p build/_addon && cp -r behavior_pack resource_pack build/_addon/
(cd build/_addon && zip -qr ../mano-royale.mcaddon behavior_pack resource_pack)
rm -rf build/_addon
```

## Replit Server
A small Node static server on port 5000 exposes the project, lets you browse the packs, and serves the built artifacts at:
- `/download/mano-royale.mcaddon`
- `/download/mano-royale-BP.mcpack`
- `/download/mano-royale-RP.mcpack`

Workflow: `Start application` → `node server.js`.
Deployment: `autoscale` running `node server.js`.

## Recent Changes
- **2026-04-21 (v1.2.0)** — Full rewrite:
  - Replaced corrupted `main.js` with a clean, universal offhand engine using `EquipmentSlot.Offhand` and runtime component detection (food/block/tool/weapon/torch/potion).
  - Added trigger item, mode cycling, action bar HUD, dynamic torch light, swap.
  - Generated pack icons + item textures procedurally (`pngjs`).
  - Added i18n (`en_US`, `es_ES`, `es_MX`) and `item_texture.json`.
  - Fixed GH Actions workflow to produce a real `.mcaddon` (BP+RP combined) plus individual `.mcpack` files; switched to `actions/checkout@v4` and `upload-artifact@v4`.
  - Build artifacts published in `build/` and downloadable from the Replit preview.
