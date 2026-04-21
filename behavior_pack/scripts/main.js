/**
 * Mano Royale v1.2.0 - Sistema universal de Segunda Mano
 *
 * Funciona con CUALQUIER item: comida, bloques, herramientas, armas,
 * antorchas, pociones, etc. Detecta el tipo automáticamente.
 *
 * Disparadores de la accion del offhand:
 *   1) Usar el item "Disparador Mano Royale" (manoroyale:trigger)
 *      - sneak + use  -> ciclar modo (auto / eat / place / use)
 *      - use normal   -> ejecutar accion en offhand
 *   2) Comando: /function manoroyale:action
 *   3) Evento: /scriptevent manoroyale:action @s
 *
 * Compatible: Windows, Android (32/64), iOS, Xbox, Switch.
 */

import {
    world,
    system,
    EquipmentSlot,
    ItemStack,
    GameMode,
    BlockPermutation
} from "@minecraft/server";

// ============================================================
//  CONSTANTES
// ============================================================

const MOD_TAG          = "§6[Mano Royale]§r";
const TRIGGER_ITEM     = "manoroyale:trigger";
const OFFHAND_TORCH    = "manoroyale:offhand_torch";
const RAYCAST_DISTANCE = 6;
const TORCH_LIGHT_LVL  = 14;
const DP_MODE          = "mr_mode";   // dynamic property por jugador (mode)

// Modos de operacion para el disparador
const MODES = ["auto", "eat", "place", "use", "swap"];

// ============================================================
//  HELPERS DE OFFHAND
// ============================================================

function getEquippable(player) {
    return player.getComponent("minecraft:equippable");
}

function getOffhandItem(player) {
    try {
        const eq = getEquippable(player);
        return eq ? eq.getEquipment(EquipmentSlot.Offhand) : undefined;
    } catch (e) {
        return undefined;
    }
}

function setOffhandItem(player, item) {
    try {
        const eq = getEquippable(player);
        if (!eq) return false;
        eq.setEquipment(EquipmentSlot.Offhand, item);
        return true;
    } catch (e) {
        return false;
    }
}

function getMainhandItem(player) {
    try {
        const eq = getEquippable(player);
        return eq ? eq.getEquipment(EquipmentSlot.Mainhand) : undefined;
    } catch (e) {
        return undefined;
    }
}

function setMainhandItem(player, item) {
    try {
        const eq = getEquippable(player);
        if (!eq) return false;
        eq.setEquipment(EquipmentSlot.Mainhand, item);
        return true;
    } catch (e) {
        return false;
    }
}

function decrementOrClear(player, item) {
    if (!item) return;
    if (item.amount > 1) {
        const next = item.clone();
        next.amount = item.amount - 1;
        setOffhandItem(player, next);
    } else {
        setOffhandItem(player, undefined);
    }
}

// ============================================================
//  DETECCION UNIVERSAL DEL TIPO DE ITEM
//  No usamos listas cerradas; revisamos componentes y heuristica
//  por id para soportar TODOS los items del juego (vanilla y modded).
// ============================================================

function hasFoodComponent(item) {
    try { return !!item.getComponent("minecraft:food"); } catch (_) { return false; }
}
function hasDurability(item) {
    try { return !!item.getComponent("minecraft:durability"); } catch (_) { return false; }
}

function looksLikeBlock(typeId) {
    // Heuristica generica: si existe el bloque homonimo, es colocable
    if (!typeId) return false;
    const id = typeId.includes(":") ? typeId : `minecraft:${typeId}`;
    try {
        BlockPermutation.resolve(id);
        return true;
    } catch (_) {
        return false;
    }
}

const WEAPON_HINTS = ["sword", "axe", "bow", "crossbow", "trident", "mace"];
const TOOL_HINTS   = ["pickaxe", "shovel", "hoe", "shears", "fishing_rod", "flint_and_steel", "shield"];
const RANGED_HINTS = ["bow", "crossbow", "trident", "snowball", "egg", "ender_pearl", "splash_potion", "lingering_potion"];

function idIncludes(typeId, list) {
    if (!typeId) return false;
    const id = typeId.toLowerCase();
    return list.some(h => id.includes(h));
}

/**
 * Devuelve uno de:
 *   "food" | "block" | "weapon" | "tool" | "ranged" | "torch" | "potion" | "unknown"
 */
function detectType(item) {
    if (!item) return "unknown";
    const id = item.typeId || "";

    if (id === OFFHAND_TORCH || id === "minecraft:torch" || id === "minecraft:soul_torch" || id === "minecraft:redstone_torch") {
        return "torch";
    }
    if (id.includes("potion")) return "potion";
    if (hasFoodComponent(item)) return "food";
    if (idIncludes(id, RANGED_HINTS)) return "ranged";
    if (idIncludes(id, WEAPON_HINTS)) return "weapon";
    if (idIncludes(id, TOOL_HINTS))   return "tool";
    if (looksLikeBlock(id))           return "block";
    if (hasDurability(item))          return "tool";
    return "unknown";
}

function typeLabel(t) {
    return ({
        food:   "§a🍎 Comer",
        block:  "§b🧱 Colocar",
        tool:   "§e🛠 Usar",
        weapon: "§c⚔ Atacar",
        ranged: "§6🏹 Disparar",
        torch:  "§e🔥 Iluminar",
        potion: "§d⚗ Beber",
        unknown:"§7? Desconocido"
    })[t] || "§7?";
}

// ============================================================
//  ACCIONES
// ============================================================

function actionEat(player, item) {
    try {
        // Daño/curación según comida — Minecraft maneja saturacion al usar el item,
        // pero sin clic real solo podemos simular: aplicamos saturacion + curacion ligera
        // y efectos especiales para items conocidos.
        const id = item.typeId;
        if (id === "minecraft:golden_apple") {
            player.addEffect("absorption", 2400, { amplifier: 0, showParticles: false });
            player.addEffect("regeneration", 100, { amplifier: 1, showParticles: false });
        } else if (id === "minecraft:enchanted_golden_apple") {
            player.addEffect("absorption", 2400, { amplifier: 3, showParticles: false });
            player.addEffect("regeneration", 400, { amplifier: 1, showParticles: false });
            player.addEffect("fire_resistance", 6000, { amplifier: 0, showParticles: false });
        } else if (id === "minecraft:milk_bucket") {
            // limpia efectos
            for (const ef of player.getEffects()) player.removeEffect(ef.typeId);
            setOffhandItem(player, new ItemStack("minecraft:bucket", 1));
            player.playSound("random.drink");
            player.sendMessage(`${MOD_TAG} §aBebiste leche.`);
            return;
        }
        player.addEffect("saturation", 30, { amplifier: 1, showParticles: false });
        player.runCommand("playsound random.eat @s ~ ~ ~");
        decrementOrClear(player, item);
        player.sendMessage(`${MOD_TAG} §aComiste §f${id.replace("minecraft:", "")}§a.`);
    } catch (e) {
        player.sendMessage(`${MOD_TAG} §cError al comer: ${e}`);
    }
}

function actionPlace(player, item) {
    try {
        const view = player.getViewDirection();
        const eye  = player.getHeadLocation();
        const hit  = player.getBlockFromViewDirection({ maxDistance: RAYCAST_DISTANCE });

        let target;
        if (hit && hit.block) {
            // colocar adyacente a la cara golpeada
            const face = hit.face;
            target = hit.block.offset(faceToVec(face));
        } else {
            // colocar al frente del jugador
            target = {
                x: Math.floor(eye.x + view.x * 2),
                y: Math.floor(eye.y + view.y * 2),
                z: Math.floor(eye.z + view.z * 2)
            };
        }

        const id = item.typeId.includes(":") ? item.typeId : `minecraft:${item.typeId}`;
        const perm = BlockPermutation.resolve(id);
        const block = player.dimension.getBlock(target);
        if (!block) {
            player.sendMessage(`${MOD_TAG} §cNo hay bloque destino`);
            return;
        }
        if (block.typeId !== "minecraft:air") {
            player.sendMessage(`${MOD_TAG} §cEspacio ocupado por §f${block.typeId}`);
            return;
        }
        block.setPermutation(perm);
        player.runCommand(`playsound dig.stone @s ${target.x} ${target.y} ${target.z}`);

        // Consumo en supervivencia
        const gm = player.getGameMode ? player.getGameMode() : undefined;
        if (gm !== GameMode.creative) decrementOrClear(player, item);

        player.sendMessage(`${MOD_TAG} §a✓ Colocado §f${id.replace("minecraft:", "")}`);
    } catch (e) {
        player.sendMessage(`${MOD_TAG} §cNo se puede colocar: ${e}`);
    }
}

function faceToVec(face) {
    switch (face) {
        case "Up":    return { x: 0,  y: 1,  z: 0  };
        case "Down":  return { x: 0,  y: -1, z: 0  };
        case "North": return { x: 0,  y: 0,  z: -1 };
        case "South": return { x: 0,  y: 0,  z: 1  };
        case "East":  return { x: 1,  y: 0,  z: 0  };
        case "West":  return { x: -1, y: 0,  z: 0  };
        default:      return { x: 0,  y: 1,  z: 0  };
    }
}

function actionSwap(player) {
    const off  = getOffhandItem(player);
    const main = getMainhandItem(player);
    setOffhandItem(player, main);
    setMainhandItem(player, off);
    player.sendMessage(`${MOD_TAG} §b⇄ Intercambiadas las manos`);
}

function actionUseToolOrWeapon(player, item) {
    // Sin un clic real no podemos minar/atacar; lo intercambiamos a la mano
    // principal para que el jugador pueda usarlo de inmediato.
    const main = getMainhandItem(player);
    setOffhandItem(player, main);
    setMainhandItem(player, item);
    player.sendMessage(`${MOD_TAG} §e🛠 §fListo para usar §a${item.typeId.replace("minecraft:", "")}`);
}

function actionPotion(player, item) {
    // Aplicamos efecto basico y consumimos
    player.addEffect("regeneration", 200, { amplifier: 0, showParticles: true });
    player.runCommand("playsound random.drink @s ~ ~ ~");
    decrementOrClear(player, item);
    player.sendMessage(`${MOD_TAG} §dBebiste la pocion`);
}

function actionTorch(player) {
    // Iluminacion dinamica cerca del jugador
    try {
        const loc = player.location;
        player.dimension.runCommand(
            `setblock ${Math.floor(loc.x)} ${Math.floor(loc.y + 1)} ${Math.floor(loc.z)} light_block 14 keep`
        );
        player.sendMessage(`${MOD_TAG} §e🔥 Iluminacion +${TORCH_LIGHT_LVL}`);
    } catch (_) { /* light_block requiere experimentos en algunas versiones */ }
}

// ============================================================
//  DISPATCHER
// ============================================================

function getMode(player) {
    const m = player.getDynamicProperty(DP_MODE);
    return (typeof m === "string" && MODES.includes(m)) ? m : "auto";
}
function setMode(player, mode) {
    player.setDynamicProperty(DP_MODE, mode);
    player.onScreenDisplay.setActionBar(`${MOD_TAG} §fModo: §a${mode}`);
}
function cycleMode(player) {
    const cur = getMode(player);
    const next = MODES[(MODES.indexOf(cur) + 1) % MODES.length];
    setMode(player, next);
}

function performOffhandAction(player) {
    const item = getOffhandItem(player);
    if (!item) {
        player.sendMessage(`${MOD_TAG} §cNo hay nada en la segunda mano`);
        return;
    }

    const mode = getMode(player);
    const detected = detectType(item);
    const finalAction = mode === "auto" ? detected : mode;

    switch (finalAction) {
        case "food":   return actionEat(player, item);
        case "block":  return actionPlace(player, item);
        case "potion": return actionPotion(player, item);
        case "torch":  return actionTorch(player);
        case "tool":
        case "weapon":
        case "ranged":
        case "use":    return actionUseToolOrWeapon(player, item);
        case "swap":   return actionSwap(player);
        case "eat":    return actionEat(player, item);
        case "place":  return actionPlace(player, item);
        default:
            player.sendMessage(`${MOD_TAG} §7Item no reconocido (§f${item.typeId}§7). Modo §f${mode}§7.`);
    }
}

// ============================================================
//  HUD ACTION BAR (estado constante)
// ============================================================

system.runInterval(() => {
    for (const p of world.getAllPlayers()) {
        try {
            const off = getOffhandItem(p);
            const mode = getMode(p);
            if (!off) {
                p.onScreenDisplay.setActionBar(`§7[Offhand] vacio §8| §7modo §f${mode}`);
            } else {
                const t = detectType(off);
                p.onScreenDisplay.setActionBar(
                    `§6[Offhand] §f${off.typeId.replace("minecraft:", "")} §7x${off.amount} §8| ${typeLabel(t)} §8| §7modo §f${mode}`
                );
            }
        } catch (_) {}
    }
}, 10); // 2 veces por segundo

// ============================================================
//  EVENTOS / DISPARADORES
// ============================================================

// 1) Item disparador (sneak = ciclar modo, use = ejecutar accion)
world.afterEvents.itemUse.subscribe((ev) => {
    const player = ev.source;
    const it = ev.itemStack;
    if (!player || !it) return;
    if (it.typeId !== TRIGGER_ITEM) return;

    if (player.isSneaking) cycleMode(player);
    else performOffhandAction(player);
});

// 2) Funciones / scriptevent
system.afterEvents.scriptEventReceive.subscribe((ev) => {
    const id = ev.id;
    const src = ev.sourceEntity;
    if (!src || src.typeId !== "minecraft:player") return;

    if (id === "manoroyale:action") performOffhandAction(src);
    else if (id === "manoroyale:cycle") cycleMode(src);
    else if (id === "manoroyale:swap")  actionSwap(src);
    else if (id === "manoroyale:give") {
        src.runCommand(`give @s ${TRIGGER_ITEM}`);
        src.runCommand(`give @s ${OFFHAND_TORCH}`);
    }
}, { namespaces: ["manoroyale"] });

// 3) Antorcha en offhand: ilumina al jugador automaticamente
system.runInterval(() => {
    for (const p of world.getAllPlayers()) {
        try {
            const off = getOffhandItem(p);
            if (!off) continue;
            if (off.typeId === OFFHAND_TORCH || off.typeId === "minecraft:torch") {
                actionTorch(p);
            }
        } catch (_) {}
    }
}, 20);

// ============================================================
//  BIENVENIDA
// ============================================================

world.afterEvents.playerSpawn.subscribe((ev) => {
    if (!ev.initialSpawn) return;
    const p = ev.player;
    p.sendMessage(`${MOD_TAG} §aBienvenido. Usa §f/function manoroyale:give§a para obtener el disparador.`);
    p.sendMessage(`${MOD_TAG} §7Modos: ${MODES.map(m => "§f" + m).join("§7, ")}.`);
});

console.warn(`${MOD_TAG} v1.2.0 cargado correctamente.`);
