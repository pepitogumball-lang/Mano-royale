/**
 * Mano Royale - Sistema de Segunda Mano (Offhand) con Auto-Detect
 * v1.1.0 - Detección automática de bloques vs comida
 * 
 * Características:
 * - Detecta automáticamente si el item es comida o bloque
 * - Botón dinámico: "Comer" para comida, "Colocar" para bloques
 * - Interfaz optimizada para Android
 * - Compatible con Samsung Galaxy Tab Android 14
 */

import { world, ItemStack, Player } from "@minecraft/server";

// ========== CONSTANTES ==========

const OFFHAND_SLOT = 45;
const OFFHAND_TORCH = "manoroyale:offhand_torch";
const OFFHAND_NAMESPACE = "manoroyale";
const TAG_OFFHAND = "offhand_active";
const MOD_NAME = "§6[Mano Royale v1.1]§r";
const MOD_VERSION = "1.1.0";
const RAYCAST_DISTANCE = 5;

// ========== FUNCIONES BÁSICAS ==========

/**
 * Obtiene el item de la segunda mano
 * @param {Player} player - Jugador del que obtener el item
 * @returns {ItemStack|null} Item o null si no hay
 */
function getOffhandItem(player) {
    try {
        const inventory = player.getComponent("minecraft:inventory");
        if (!inventory || !inventory.container) return null;
        return inventory.container.getItem(OFFHAND_SLOT);
    } catch (error) {
        console.warn(`${MOD_NAME} Error obteniendo item offhand: ${error.message}`);
        return null;
    }
}

/**
 * Establece un item en la segunda mano
 * @param {Player} player - Jugador objetivo
 * @param {ItemStack|null} item - Item a establecer (null para vaciar)
 * @returns {boolean} Éxito
 */
function setOffhandItem(player, item) {
    try {
        const inventory = player.getComponent("minecraft:inventory");
        if (!inventory || !inventory.container) return false;
        
        if (item) {
            inventory.container.setItem(OFFHAND_SLOT, item);
        } else {
            inventory.container.setItem(OFFHAND_SLOT, undefined);
        }
        return true;
    } catch (error) {
        console.warn(`${MOD_NAME} Error estableciendo item offhand: ${error.message}`);
        return false;
    }
}

/**
 * Comer item de segunda mano
 * @param {Player} player - Jugador que come
 */
function eatOffhandItem(player) {
    const item = getOffhandItem(player);
    if (!item) return;

    const typeId = item.typeId;
    const canEat = isEdibleItem(typeId);

    if (!canEat) {
        player.sendMessage("§cEste item no es comestible");
        return;
    }

    try {
        // Aplicar efectos según el tipo
        applyFoodEffects(player, typeId);

        // Reducir cantidad
        if (item.amount > 1) {
            item.amount--;
            setOffhandItem(player, item);
        } else {
            setOffhandItem(player, null);
        }

        player.sendMessage(`§aHas comido ${item.nameTag || typeId}`);
    } catch (error) {
        console.error(`[Mano Royale] Error comiendo item: ${error.message}`);
    }
}

/**
 * Determina si un item es comestible
 * @param {string} typeId - ID del item
 * @returns {boolean}
 */
function isEdibleItem(typeId) {
    const edibleItems = [
        "minecraft:apple",
        "minecraft:golden_apple",
        "minecraft:enchanted_golden_apple",
        "minecraft:carrot",
        "minecraft:baked_potato",
        "minecraft:beef",
        "minecraft:cooked_beef",
        "minecraft:chicken",
        "minecraft:cooked_chicken",
        "minecraft:mutton",
        "minecraft:cooked_mutton",
        "minecraft:porkchop",
        "minecraft:cooked_porkchop",
        "minecraft:fish",
        "minecraft:cooked_fish",
        "minecraft:salmon",
        "minecraft:cooked_salmon",
        "minecraft:bread",
        "minecraft:cookie",
        "minecraft:melon_slice",
        "minecraft:sweet_berries",
        "minecraft:glow_berries",
        "minecraft:dried_kelp",
        "minecraft:pumpkin_pie",
        "minecraft:cake",
        "minecraft:beetroot",
        "minecraft:mushroom_stew",
        "minecraft:rabbit_stew"\n    ];\n    return edibleItems.includes(typeId);\n}\n\n/**\n * Lista de bloques colocables desde offhand\n * @param {string} typeId - ID del item\n * @returns {boolean}\n */\nfunction isPlaceableBlock(typeId) {\n    const placeableBlocks = [\n        \"minecraft:oak_log\",\n        \"minecraft:spruce_log\",\n        \"minecraft:birch_log\",\n        \"minecraft:jungle_log\",\n        \"minecraft:acacia_log\",\n        \"minecraft:dark_oak_log\",\n        \"minecraft:oak_planks\",\n        \"minecraft:spruce_planks\",\n        \"minecraft:birch_planks\",\n        \"minecraft:jungle_planks\",\n        \"minecraft:acacia_planks\",\n        \"minecraft:dark_oak_planks\",\n        \"minecraft:stone\",\n        \"minecraft:granite\",\n        \"minecraft:diorite\",\n        \"minecraft:andesite\",\n        \"minecraft:dirt\",\n        \"minecraft:grass_block\",\n        \"minecraft:sand\",\n        \"minecraft:red_sand\",\n        \"minecraft:gravel\",\n        \"minecraft:oak_leaves\",\n        \"minecraft:spruce_leaves\",\n        \"minecraft:birch_leaves\",\n        \"minecraft:jungle_leaves\",\n        \"minecraft:acacia_leaves\",\n        \"minecraft:dark_oak_leaves\",\n        \"minecraft:cobblestone\",\n        \"minecraft:stone_bricks\",\n        \"minecraft:brick_block\",\n        \"minecraft:nether_brick\",\n        \"minecraft:terracotta\",\n        \"minecraft:white_wool\",\n        \"minecraft:light_gray_wool\",\n        \"minecraft:gray_wool\",\n        \"minecraft:black_wool\",\n        \"minecraft:red_wool\",\n        \"minecraft:orange_wool\",\n        \"minecraft:yellow_wool\",\n        \"minecraft:lime_wool\",\n        \"minecraft:green_wool\",\n        \"minecraft:cyan_wool\",\n        \"minecraft:light_blue_wool\",\n        \"minecraft:blue_wool\",\n        \"minecraft:purple_wool\",\n        \"minecraft:magenta_wool\",\n        \"minecraft:pink_wool\",\n        \"minecraft:brown_wool\",\n        \"minecraft:torch\",\n        \"minecraft:soul_torch\",\n        \"minecraft:manoroyale:offhand_torch\"\n    ];\n    return placeableBlocks.includes(typeId);\n}\n\n/**\n * Detecta automáticamente el tipo de item (comida, bloque, herramienta, etc)\n * @param {string} typeId - ID del item\n * @returns {string} Tipo del item: 'food', 'block', 'tool', 'unknown'\n */\nfunction detectItemType(typeId) {\n    if (isEdibleItem(typeId)) return 'food';\n    if (isPlaceableBlock(typeId)) return 'block';\n    if (typeId.includes('pickaxe') || typeId.includes('axe') || typeId.includes('shovel') || typeId.includes('hoe') || typeId.includes('sword')) return 'tool';\n    if (typeId.includes('bow') || typeId.includes('arrow')) return 'ranged';\n    return 'unknown';\n}

/**
 * Aplica efectos según el tipo de comida
 * @param {Player} player - Jugador que recibe efectos
 * @param {string} typeId - Tipo de item comido
 */
function applyFoodEffects(player, typeId) {
    switch (typeId) {
        case "minecraft:golden_apple":
            player.addEffect("absorption", 2400, { amplifier: 0 });
            player.addEffect("regeneration", 100, { amplifier: 1 });
            break;
        case "minecraft:enchanted_golden_apple":
            player.addEffect("absorption", 2400, { amplifier: 3 });
            player.addEffect("regeneration", 400, { amplifier: 2 });
            player.addEffect("fire_resistance", 3600, { amplifier: 0 });
            break;
        case "minecraft:apple":
            player.addEffect("regeneration", 100, { amplifier: 0 });
            break;
        default:
            // Efectos básicos de saturación
            player.addEffect("saturation", 30, { amplifier: 0 });
    }
}

// ========== EVENTOS ==========

/**
 * Inicialización del mundo
 */
world.afterEvents.worldInitialize.subscribe(() => {
    console.log("[Mano Royale] Sistema de offhand inicializado");
    world.setDynamicProperty("mano_royale_active", true);
});

/**
 * Evento cuando el jugador está en el servidor
 */
world.afterEvents.playerSpawn.subscribe((event) => {
    const player = event.player;
    player.sendMessage("§6[Mano Royale]§r Usa /function manoroyale:eat_offhand para comer desde la segunda mano");
});

// Exportar funciones para comandos
// ========== NUEVAS FUNCIONES v1.1.0 ==========

/**
 * Detecta si es bloque o comida de manera automática
 * @param {ItemStack} item - Item a verificar
 * @returns {string} 'food', 'block', 'tool', o 'unknown'
 */
function detectItemType(item) {
    if (!item) return 'unknown';
    if (isEdibleItem(item.typeId)) return 'food';
    if (isPlaceableBlock(item.typeId)) return 'block';
    if (item.typeId.includes('pickaxe') || item.typeId.includes('axe') || item.typeId.includes('shovel')) return 'tool';
    return 'unknown';
}

/**
 * Verifica si item es bloque colocable
 * @param {string} typeId - ID del item
 * @returns {boolean}
 */\nfunction isPlaceableBlock(typeId) {\n    const blocks = [\n        "minecraft:oak_log", "minecraft:stone", "minecraft:dirt", "minecraft:grass_block",\n        "minecraft:sand", "minecraft:gravel", "minecraft:oak_leaves", "minecraft:cobblestone",\n        "minecraft:torch", "minecraft:soul_torch", "minecraft:brick_block", "minecraft:oak_planks",\n        "minecraft:spruce_planks", "minecraft:birch_planks", "minecraft:jungle_planks",\n        "minecraft:acacia_planks", "minecraft:dark_oak_planks", "minecraft:white_wool"\n    ];\n    return blocks.includes(typeId);\n}\n\n/**\n * Coloca bloque desde offhand automáticamente\n * @param {Player} player - Jugador que coloca\n */\nfunction placeBlockFromOffhand(player) {\n    const item = getOffhandItem(player);\n    if (!item || detectItemType(item) !== 'block') {\n        player.sendMessage(`${MOD_NAME} §cNo hay bloque en offhand`);\n        return;\n    }\n\n    try {\n        const pos = {\n            x: Math.floor(player.location.x + player.getViewDirection().x * 5),\n            y: Math.floor(player.location.y + player.getViewDirection().y * 5),\n            z: Math.floor(player.location.z + player.getViewDirection().z * 5)\n        };\n        \n        const blockType = item.typeId.replace('minecraft:', '');\n        player.dimension.setBlockType(pos, blockType);\n        \n        if (item.amount > 1) {\n            item.amount--;\n            setOffhandItem(player, item);\n        } else {\n            setOffhandItem(player, null);\n        }\n        \n        player.sendMessage(`${MOD_NAME} §a✓ Bloque colocado`);\n    } catch (error) {\n        console.error(`${MOD_NAME} Error: ${error.message}`);\n    }\n}\n\n/**\n * Acción automática según tipo de item\n * @param {Player} player - Jugador\n */\nfunction performOffhandAction(player) {\n    const item = getOffhandItem(player);\n    if (!item) return;\n\n    const type = detectItemType(item);\n    \n    if (type === 'food') {\n        eatOffhandItem(player);\n    } else if (type === 'block') {\n        placeBlockFromOffhand(player);\n    }\n}\n\n// ========== EVENTOS ==========\n\nworld.afterEvents.worldInitialize.subscribe(() => {\n    console.log(`${MOD_NAME} Sistema iniciado (v${MOD_VERSION})`);\n    world.setDynamicProperty(\"mano_royale_active\", true);\n});\n\nworld.afterEvents.playerSpawn.subscribe((event) => {\n    const player = event.player;\n    if (!player.getDynamicProperty(\"mano_royale_welcomed\")) {\n        player.setDynamicProperty(\"mano_royale_welcomed\", true);\n        player.sendMessage(`${MOD_NAME} §7Botón automático en HUD para offhand`);\n    }\n});\n\nworld.afterEvents.chatSend.subscribe((event) => {\n    if (event.message === \"!offhand\") {\n        const player = event.sender;\n        const item = getOffhandItem(player);\n        if (item) {\n            player.sendMessage(`${MOD_NAME} Item: ${item.typeId}, Tipo: ${detectItemType(item)}`);\n        }\n    }\n});\n\n// ========== EXPORTAR ==========\n\nexport {\n    eatOffhandItem,\n    placeBlockFromOffhand,\n    performOffhandAction,\n    getOffhandItem,\n    setOffhandItem,\n    detectItemType,\n    isEdibleItem,\n    isPlaceableBlock\n};