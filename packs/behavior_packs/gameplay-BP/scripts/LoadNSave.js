/*********************************************************************
 * This script is used to load and save structures in the world.
 * It uses the existed commands /structure save and /structure load
 * to save and load structures by simplifying the process.
 *********************************************************************/

import { world } from "@minecraft/server";

// Save a structure
export function saveStructure(name, from, to, includesEntities = true, saveMode = "memory", includesBlocks = true) {
    const command = `structure save "${name}" ${from.x} ${from.y} ${from.z} ${to.x} ${to.y} ${to.z} ${includesEntities} ${saveMode} ${includesBlocks}`;
    world.getDimension("overworld").runCommandAsync(command);
    // world.sendMessage(`Structure ${name} saved`);
}

// Load a structure
export function loadStructure(name, to, rotation = "0_degrees", mirror = "none", animmationMode = "block_by_block") {
    const command = `structure load "${name}" ${to.x} ${to.y} ${to.z} ${rotation} ${mirror} ${animmationMode}`;
    world.getDimension("overworld").runCommandAsync(command);
    // world.sendMessage(`Structure ${name} loaded`);
}