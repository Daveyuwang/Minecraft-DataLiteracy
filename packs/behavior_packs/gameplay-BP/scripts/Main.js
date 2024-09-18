import { world, system } from "@minecraft/server";
import { ActionFormData, ModalFormData } from "@minecraft/server-ui";
import { TextDisplay } from "./TextDisplay.js";
import { TextDisplayV2 } from "./TextDisplayV2.js";
import { PlayerDistanceTracker } from "./playerDistanceTracker.js";
import { disableTimerDisplay, elapsedSeconds, timerActive, toggleTimer} from "./Timer.js";
import { dataPoints } from "./scatterplotData.js";
import { STARTER_ENTITY_ID } from "./MiniGames.js";
import { generateTreasureBlock } from "./TreasureHunt.js";
import { sessionStartTime } from "./Session.js";

// initialize the block counts for each level
world.afterEvents.worldInitialize.subscribe(() => {
  initialzeBlockCountsByLevel();
});

world.afterEvents.worldInitialize.subscribe(() => {
  system.runTimeout(() => {
    TextDisplay.deleteAll();
    TextDisplayV2.deleteAll();
  }, 10);

  saveArea();
});


// ======================================================================================================

  // pre-defined block counts for each level (blockType: count)
  const PRE_DEFINED_BLOCK_COUNTS = [
    {"minecraft:stone":198, "minecraft:coal_ore":28,"minecraft:copper_ore":11,"minecraft:iron_ore":24,"minecraft:gold_ore":17,"minecraft:diamond_ore":7,"minecraft:emerald_ore":2,"minecraft:lapis_ore":2,"minecraft:grass_block":72},
      {"minecraft:stone":161, "minecraft:coal_ore":16,"minecraft:copper_ore":16,"minecraft:iron_ore":7,"minecraft:gold_ore":10,"minecraft:diamond_ore":4,"minecraft:emerald_ore":8,"minecraft:lapis_ore":3,"minecraft:grass_block":64},
      {"minecraft:stone":101, "minecraft:coal_ore":16,"minecraft:copper_ore":14,"minecraft:iron_ore":14,"minecraft:gold_ore":14,"minecraft:diamond_ore":5,"minecraft:emerald_ore":3,"minecraft:lapis_ore":2,"minecraft:grass_block":56},
      {"minecraft:stone":68, "minecraft:coal_ore":16,"minecraft:copper_ore":10,"minecraft:iron_ore":14,"minecraft:gold_ore":8,"minecraft:diamond_ore":3,"minecraft:emerald_ore":1,"minecraft:lapis_ore":1,"minecraft:grass_block":48},
      {"minecraft:stone":34, "minecraft:coal_ore":6,"minecraft:copper_ore":12,"minecraft:iron_ore":8,"minecraft:gold_ore":4,"minecraft:diamond_ore":16,"minecraft:grass_block":40},
      {"minecraft:stone":20, "minecraft:coal_ore":3,"minecraft:copper_ore":2,"minecraft:iron_ore":8,"minecraft:gold_ore":5,"minecraft:diamond_ore":3,"minecraft:emerald_ore":3,"minecraft:lapis_ore":5,"minecraft:grass_block":32},
      {"minecraft:stone":4, "minecraft:coal_ore":3,"minecraft:copper_ore":7,"minecraft:iron_ore":2,"minecraft:gold_ore":2,"minecraft:diamond_ore":1,"minecraft:lapis_ore":6,"minecraft:grass_block":24},
      {"minecraft:stone":2, "minecraft:gold_ore":4,"minecraft:emerald_ore":2,"minecraft:lapis_ore":1,"minecraft:grass_block":16},
      {"minecraft:stone":3, "minecraft:diamond_ore":1,"minecraft:grass_block":12},
      {"minecraft:stone":1, "minecraft:lapis_ore":1,"minecraft:grass_block":6}
  ];

  // initial block counts for each level (blockType: count)
  let initialBlockCountsByLevel = PRE_DEFINED_BLOCK_COUNTS;
  
  // level coordinates (x1, x2, y1, y2, z1, z2)
  const levelBoundaries = [
    { level: 1, minX: -54, maxX: -36, minY: -27, minY: -27, minZ: 92, maxZ: 110 },
    { level: 2, minX: -54, maxX: -36, minY: -26, minY: -26, minZ: 92, maxZ: 110 },
    { level: 3, minX: -54, maxX: -36, minY: -25, minY: -25, minZ: 92, maxZ: 110 },
    { level: 4, minX: -54, maxX: -36, minY: -24, minY: -24, minZ: 92, maxZ: 110 },
    { level: 5, minX: -54, maxX: -36, minY: -23, minY: -23, minZ: 92, maxZ: 110 },
    { level: 6, minX: -54, maxX: -36, minY: -22, minY: -22, minZ: 92, maxZ: 110 },
    { level: 7, minX: -54, maxX: -36, minY: -21, minY: -21, minZ: 92, maxZ: 110 },
    { level: 8, minX: -54, maxX: -36, minY: -20, minY: -20, minZ: 92, maxZ: 110 },
    { level: 9, minX: -54, maxX: -36, minY: -19, minY: -19, minZ: 92, maxZ: 110 },
    { level: 10, minX: -54, maxX: -36, minY: -18, minY: -18, minZ: 92, maxZ: 110 }
  ];

  //======================================================================================================

  // BAR GRAPH CONFIGURATION
  let BAR_canvasCoordinates = {x1:1,y1:-1,z1:94,x2:1,y2:-25,z2:117};  // canvas area (bottom left corner and top right corner)
  let BAR_canvasMaxHeight = 24; // maximum height for the bar graph (y-axis from bottom to top)
  let BAR_canvasCoordinatesV2 = {x1:1,y1:-1,z1:94,x2:1,y2:-25,z2:122};  // canvas area (bottom left corner and top right corner)

  const barColors = [
  "minecraft:green_wool", // bar1
  "minecraft:cyan_wool", // bar2
  "minecraft:light_blue_wool", // bar3
  "minecraft:yellow_wool", // bar4
  "minecraft:lime_wool", // bar5
  "minecraft:red_wool", // bar6
  "minecraft:magenta_wool", // bar7
  "minecraft:blue_wool" // bar8
  ];
  const barColorv2 = [
  "minecraft:green_wool", // bar1
  "minecraft:cyan_wool", // bar2
  "minecraft:light_blue_wool", // bar3
  "minecraft:yellow_wool", // bar4
  "minecraft:lime_wool", // bar5
  "minecraft:red_wool", // bar6
  "minecraft:magenta_wool", // bar7
  "minecraft:blue_wool", // bar8
  "minecraft:orange_wool", // bar9
  "minecraft:purple_wool" // bar10
  ];
  const BAR_colorCodes = ["§2","§3","§b","§e","§a","§4","§d","§1"]; // color codes for the block names in the scoreboard (BAR GRAPH)
  const BAR_colorCodesv2 = ["§2","§3","§b","§e","§a","§4","§d","§1","§6","§5"]; // color codes for the block names in the scoreboard (BAR GRAPH)
  const barStartZ = [94, 97, 100, 103, 106, 109, 112, 115]; // z-coordinates for the start of each bar
  const barStartZv2 = [94, 97, 100, 103, 106, 109, 112, 115, 118, 121]; // z-coordinates for the start of each bar
  const startXY = {x:1, y:-25}; // x and y coordinates for the start of the bars

  let levelIndex = 0;   // index of the selected level for BAR GRAPH
  let BOARD_ON = false;  // flag to indicate if the scoreboard is on or off

  //======================================================================================================

  // LINE GRAPH CONFIGURATION
  let LINE_canvasCoordinates = {x1:-2,y1:-25,z1:138,x2:-31,y2:-1,z2:138}; // canvas area (bottom left corner and top right corner)
  const canvasBlock = "minecraft:gray_concrete";
  const LINE_buildBlockList = ["minecraft:yellow_wool", "minecraft:light_blue_wool", "minecraft:green_wool"]; // block types for the lines
  const LINE_pointBlockList = ["minecraft:orange_wool", "minecraft:blue_wool","minecraft:lime_wool"]; // block types for the points

  // the start position for the line graph (bottom left corner of the canvas)
  const LINE_baseX = -4;
  const LINE_baseY = -25;
  const LINE_baseZ = 137;

  // interval and maximum height for the canvas
  const LINE_levelWidth = 3; // width between the levels (x-axis interval)
  const LINE_maxHeight = 23;  // maximum height for the line graph (y-axis from bottom to top)
  const LINE_maxWidth = 29; // maximum width for the line graph (x-axis from left to right)

  //======================================================================================================

  // SCATTERPLOT CONFIGURATION
  let SCATTER_canvasCoordinates = {x1:-39,y1:-25,z1:138,x2:-67,y2:-1,z2:138}; // canvas area (bottom left corner and top right corner)
  const SCATTER_pointBlockList = ["minecraft:orange_wool", "minecraft:blue_wool","minecraft:lime_wool"];  // block types for the points (visualization)
  const LS_colorCodes = ["§6","§b","§a"]; // color codes for the block names in the scoreboard (LINE GRAPH & SCATTERPLOT)

  // the start position for the scatterplot (bottom left corner of the canvas)
  const SCATTER_baseX = -39;
  const SCATTER_baseY = -25;
  const SCATTER_baseZ = 137;

  // interval and maximum height for the canvas
  const SCATTER_levelWidth = 3; // width between the levels (x-axis interval)
  const SCATTER_maxHeight = 23; // maximum height for the scatterplot (y-axis from bottom to top)
  const SCATTER_maxWidth = 26; // maximum width for the scatterplot (x-axis from left to right)

  //======================================================================================================
  //                                OTHER VISUALIZATION CONFIGURATIONS
  //======================================================================================================

  // existed block types in all levels
  let combinedBlockList = [];

  // point block data
  export let SCATTER_pointBlockData = [];
  export let LINE_pointBlockData = [];
  
  // item to open the visualization form
  const VISUALIZER = "minecraft:nether_star";

  // item to trigger the quantity query
  const QUERIER = "minecraft:stick";

  


  const dimension = world.getDimension("overworld");

/**************************************************************************************************** */
//                              EVENT HANDLERS & CHAT COMMANDS FOR VISUALIZATIONS
/**************************************************************************************************** */
/**
 * listen for opening the visualization form
 */
world.afterEvents.itemUse.subscribe((eventData) => {
  if(eventData.itemStack.typeId === VISUALIZER){
    createVisualizationForm();
  }
});

world.afterEvents.chatSend.subscribe((eventData) => {
  let message = eventData.message;
  
  if (message === "resetBar") {
    resetBarGraph();
    eventData.cancel = true; // Cancel the chat message
  }
});



/**************************************************************************************************** */
//                      EVENT HANDLERS & CHAT COMMANDS FOR LINE GRAPH & SCATTERPLOT
/**************************************************************************************************** */
// reset the line graph
// world.afterEvents.chatSend.subscribe((eventData) => {
//   let message = eventData.message;

//   if(message === "resetLine"){
//     resetLineGraph();
//   }
// });
// // reset the scatterplot
// world.afterEvents.chatSend.subscribe((eventData) => {
//   let message = eventData.message;

//   if(message === "resetScatter"){
//     resetScatterplot();
//   }
// });

// Quantity Query Event Handler
world.beforeEvents.itemUse.subscribe((event) => {
  const { source, itemStack } = event;

  if (itemStack.typeId === QUERIER) {
    const raycastResult = source.getBlockFromViewDirection({ maxDistance: 10 });

    if (raycastResult) {
      const block = raycastResult.block;

      let graphType = "";
      let pointBlockData = null;
      if (isPointBlock(block, "scatter")) {
        graphType = "scatter";
        pointBlockData = getTypeAndCountFromPoint(block.location, graphType);
      } else if (isPointBlock(block, "line")) {
        graphType = "line";
        pointBlockData = getTypeAndCountFromPoint(block.location, graphType);
      }
      if(pointBlockData){
        const level_ = getLevelFromGraph(block.location.x, graphType);
        const adjustedName = getFormattedBlockName(pointBlockData.blockType);
        const tellrawMessage = `tellraw @a {"rawtext":[{"text":"§aBlock Type: ${adjustedName}"}]}`;
        const tellrawMessage2 = `tellraw @a {"rawtext":[{"text":"§aQuantity: ${pointBlockData.quantity}"}]}`;
        const tellrawLevel = `tellraw @a {"rawtext":[{"text":"§aLevel: ${level_}"}]}`;
        dimension.runCommandAsync(tellrawMessage);
        dimension.runCommandAsync(tellrawMessage2);
        dimension.runCommandAsync(tellrawLevel);
      }
    }
  }
});

// Helper functions for the quantity query
function isPointBlock(block, graphType) {
  const pointBlockData = graphType === "scatter" ? SCATTER_pointBlockData : LINE_pointBlockData;
  
  return pointBlockData.some((data) => {
    return (
      data.position.x === block.location.x &&
      data.position.y === block.location.y &&
      data.position.z === block.location.z
    );
  });
}


function getTypeAndCountFromPoint(position, graphType) {
  const pointBlockData = graphType === "scatter" ? SCATTER_pointBlockData : LINE_pointBlockData;
  
  const pointData = pointBlockData.find((data) => {
    return (
      data.position.x === position.x &&
      data.position.y === position.y &&
      data.position.z === position.z
    );
  });
  
  if (pointData) {
    return {
      blockType: pointData.blockType,
      quantity: pointData.quantity,
    };
  }
  
  return null;
}

// Actionbar version of the quantity query
system.runInterval(() => {
  const player = world.getPlayers();
  player.forEach((player) => {
    const viewDirection = player.getViewDirection();
    const raycastResult = player.getBlockFromViewDirection({ maxDistance: 10 });

    if (raycastResult){
      const block = raycastResult.block;

      let graphType = "";
      let pointBlockData = null;
      let woolColor = "";
      if(isPointBlock(block, "scatter")){
        graphType = "scatter";
        pointBlockData = getTypeAndCountFromPointV2(block.location, graphType);
        woolColor = SCATTER_pointBlockList.indexOf(block.typeId);
      }else if(isPointBlock(block, "line")){
        graphType = "line";
        pointBlockData = getTypeAndCountFromPointV2(block.location, graphType);
        woolColor = LINE_pointBlockList.indexOf(block.typeId);
      }
      if(pointBlockData){
        disableTimerDisplay();
        const {xValue, yValue, xUnit, yUnit, xLabel, yLabel, blockType} = pointBlockData;
        if(!yUnit && !blockType){
        const colorCode = LS_colorCodes[woolColor];
        const actionbarText = `${colorCode}${xLabel}: §l§c${xValue}${xUnit}§r§r ${colorCode}${yLabel}:§r§r §l§c${yValue}§r§r`;
        player.runCommand(`titleraw @s actionbar {"rawtext":[{"text":"${actionbarText}"}]}`);
        }else if(blockType && !yUnit){
          const colorCode = LS_colorCodes[woolColor];
          const actionbarText = `${colorCode}§l${blockType}  §r${colorCode}${xLabel}§r: §l§c${xValue}${xUnit}§r§r ${colorCode}${yLabel}§r§r: §l§c${yValue}§r§r ${colorCode}`;
          player.runCommand(`titleraw @s actionbar {"rawtext":[{"text":"${actionbarText}"}]}`);
        }else if(yUnit && !blockType){
          const colorCode = LS_colorCodes[woolColor];
          const actionbarText = `${colorCode}${xLabel}§r: §l§c${xValue}${xUnit}§r§r ${colorCode}${yLabel}§r§r: §l§c${yValue}${yUnit}§r§r`;
          player.runCommand(`titleraw @s actionbar {"rawtext":[{"text":"${actionbarText}"}]}`);
        }
        
      }else{
        player.runCommand(`titleraw @s actionbar {"rawtext":[{"text":""}]}`);
      }
    }else{
      player.runCommand(`titleraw @s actionbar {"rawtext":[{"text":""}]}`);
    }
  });
}, 10);

const LINE_levelXCoordinates = [-4, -7, -10, -13, -16, -19, -22, -25, -28, -31];
const SCATTER_levelXCoordinates = [-40, -43, -46, -49, -52, -55, -58, -61, -64, -67];

function getLevelFromGraph(x, graphType){
  const levelXCoordinates = graphType === "scatter" ? SCATTER_levelXCoordinates : LINE_levelXCoordinates;
  for(let level = 0; level < levelXCoordinates.length; level++){
    if(x === levelXCoordinates[level]){
      return level + 1;
    }
  }
  return null;
}

function getTypeAndCountFromPointV2(location, graphType) {
  const pointBlockData = graphType === "scatter" ? SCATTER_pointBlockData : LINE_pointBlockData;
  
  for (const data of pointBlockData) {
    const { position, xValue, yValue, xLabel, yLabel, xUnit, blockType, yUnit} = data;
    if (location.x === position.x && location.y === position.y && location.z === position.z) {
      return { xValue, yValue, xLabel, yLabel, xUnit, blockType, yUnit };
    }
  }
  
  return null;
}

/**************************************************************************************************** */
//                                EVENT HANDLERS FOR BLOCK BREAK & PLACEMENT
/**************************************************************************************************** */

// Detects & updates block after removal
// TEST: print out the state
import { onBlockMined } from "./TreasureHunt.js";

world.beforeEvents.playerBreakBlock.subscribe((event) => {
  const {x, y, z} = event.block.location;
  const level = getLevelFromPosition(x,y,z);
  if(level != null){
    const blockType = event.block.typeId;
    onBlockMined(event.block.location);
    updateTypesAndCounts(blockType, false, level);

    // printLevelState(level);

    // remove the display if player breaks a block
    if(BOARD_ON){
      dimension.runCommandAsync(`function removeDisplay`);
      BOARD_ON = false;
    }
  }
});

// Detects & updates block after placement
// TEST: print out the state
world.afterEvents.playerPlaceBlock.subscribe((event) => {
  const {x, y, z} = event.block.location;
  const level = getLevelFromPosition(x,y,z);
  if(level != null){
    const blockType = event.block.typeId;
    // TEST: print
    // world.sendMessage(`Block ${blockType} placed at level ${level}`);
    updateTypesAndCounts(blockType, true, level);

    // printLevelState(level);

    // remove the display if player places a block
    if(BOARD_ON){
      dimension.runCommandAsync(`function removeDisplay`);
      BOARD_ON = false;
    }
  }
});




/*************************************************************************************************** */
//                                        BAR GRAPH VISUALIZATION FUNCTIONS
/*************************************************************************************************** */

/**
 * Reset the canvas to the initial state(TOP 8 blocks)
 */
function resetBarGraph(){
const dimension = world.getDimension("overworld");
const canvas = BAR_canvasCoordinates;
const command = `fill ${canvas.x1} ${canvas.y1} ${canvas.z1} ${canvas.x2} ${canvas.y2} ${canvas.z2} minecraft:gray_concrete`;

const removeExtensionCommand = `fill 1 -27 118 2 -1 123 minecraft:air`
const removeExtensionCommand2 = `fill 1 0 118 2 0 123 minecraft:air`
try{
  // despawn the text display used for the bar graph
  despawnAllBarGraphTexts();
  dimension.runCommand(command);
  dimension.runCommand(removeExtensionCommand);
  dimension.runCommand(removeExtensionCommand2);
  //const showMessage = `tellraw @a {"rawtext":[{"text":"§a§lBAR GRAPH RESET"}]}`
  //dimension.runCommand(showMessage);

} catch(error){
  world.sendMessage(`Error: ${error}`);
}
}

/**
 * Reset the canvas to the initial state(10 levels size)
*/
function resetBarGraphV2(){
const dimension = world.getDimension("overworld");
const canvas = BAR_canvasCoordinatesV2;
const command = `fill ${canvas.x1} ${canvas.y1} ${canvas.z1} ${canvas.x2} ${canvas.y2} ${canvas.z2} minecraft:gray_concrete`;
const buildExtensionCommand = `fill 1 -27 118 2 -1 123 minecraft:gray_concrete`
const buildExtensionCommand2 = `fill 1 0 118 2 0 123 minecraft:gray_concrete`
const replaceXAxisCommand1 = `fill 1 -26 118 1 -26 123 minecraft:white_concrete`


try{
  // despawn the text display used for the bar graph
  despawnAllBarGraphTexts();
  dimension.runCommand(command);
  dimension.runCommand(buildExtensionCommand);
  dimension.runCommand(replaceXAxisCommand1);
  dimension.runCommand(buildExtensionCommand2);
  // const showMessage = `tellraw @a {"rawtext":[{"text":"§a§lBAR GRAPH RESET"}]}`
  // dimension.runCommand(showMessage);
}catch(error){
  world.sendMessage(`Error: ${error}`);

}
}

/**
 * display top8 block counts on the sidebar
 * @param {object} levelData - block counts for the level
 */
function top8_scoreBoard(levelData){
  const dimension = world.getDimension("overworld");
  const top8 = getTop8Counts(levelData);
  dimension.runCommand(`scoreboard objectives remove top8block`);
  dimension.runCommand(`scoreboard objectives add top8block dummy "§l§6Top 8 Blocks at Level ${levelIndex + 1}§r§r"`);
  let index = 0;
  for(const [blockType, count] of Object.entries(top8)){
    const cleanName = blockType.replace("minecraft:","");
    dimension.runCommand(`scoreboard players set "${BAR_colorCodes[index++]}${cleanName}§r" top8block ${count}`);
  }
  dimension.runCommand(`scoreboard objectives setdisplay sidebar top8block`);

  BOARD_ON = true;
}


/**
 * Draw the bar graph on the canvas
 * @param {object} levelData - block counts for the level 
 */
function buildBarGraph(levelData){
  const dimension = world.getDimension("overworld");

  resetBarGraph();  // reset the canvas before drawing the new graph

  const top8Counts = getTop8Counts(levelData);
  const categoryList = [];
  const valueList = [];
  valueList.push(...Object.values(top8Counts));
  const yPositionList = [];
  const blockHeights = convertCountsToBlockHeights(top8Counts, BAR_canvasMaxHeight);
  let barIndex = 0;
  for(const [blockType, height] of Object.entries(blockHeights)){
    const color = barColors[barIndex];
    const startX = startXY.x;
    const startY = startXY.y;
    const startZ = barStartZ[barIndex];
    const endX = startX;
    const endY = startY + height;
    const endZ = startZ + 1;
    const command = `fill ${startX} ${startY} ${startZ} ${endX} ${endY} ${endZ} ${color}`;
    categoryList.push(blockType);
    try{
      dimension.runCommand(command);
    } catch(error){
      world.sendMessage(`Error: ${error}`);
    }
    yPositionList.push(startY + height + 1);
    barIndex++;
  }
  labelBarValues(valueList, yPositionList);
  const adjustedNames = categoryList.map((blockType) => getFormattedBlockName(blockType));
  labelBarGraphCategories(adjustedNames);
  const xLabel = "Block Type";
  const yLabel = "Block Quantity";
  BARGraphXYLabels(xLabel, yLabel);
  const title = `Top 8 Blocks at Level ${levelIndex + 1}`;
  BARlabelGraphTitle(title);
  const showMessage = `tellraw @a {"rawtext":[{"text":"§a§lTOP 8 BLOCKS BAR GRAPH VISUALIZED"}]}`;
  dimension.runCommand(showMessage);
}

/**************************************************************************************************** */
//                                        LINE GRAPH VISUALIZATION FUNCTIONS
/**************************************************************************************************** */

export function resetLineGraph(){
  const dimension = world.getDimension("overworld");
  const canvas = LINE_canvasCoordinates;
  const command = `fill ${canvas.x1} ${canvas.y1} ${canvas.z1 - 1} ${canvas.x2} ${canvas.y2} ${canvas.z2 - 3} minecraft:air`;
  try{
    dimension.runCommand(command);
    // const showMessage = `tellraw @a {"rawtext":[{"text":"§a§lLINE GRAPH RESET"}]}`
    // dimension.runCommand(showMessage);
  } catch(error){
    world.sendMessage(`Error: ${error}`);
  }

  LINE_pointBlockData = [];
  disableScoreboardDisplay();
}

function buildLineGraph(levelCounts, selectedBlocks){
  const woolColors = LINE_buildBlockList;
  const pointColors = LINE_pointBlockList;
  const actualCounts = getLevelCountsForSelectedBlocks(selectedBlocks);

  resetLineGraph();  // reset the canvas before drawing the new graph


  selectedBlocks.forEach((blockType, index) => {
    const woolColor = woolColors[index];
    const pointColor = pointColors[index];
    const heights = levelCounts[blockType];
    const counts = actualCounts[blockType];
    for(let level = 1; level <= heights.length; level++){
      const height = heights[level - 1];
      const count = counts[level - 1];
      const point = getCoordinatesForPoint(level, height);
      const placementPosition = getPlaceablePosition(point.x, point.y, point.z);
      placeBlock(placementPosition, pointColor);

      LINE_pointBlockData.push({
        position: placementPosition,
        blockType: blockType,
        quantity: count
      });

      if(level > 1){
        const prevHeight = heights[level - 2];
        const prevPoint = getCoordinatesForPoint(level - 1, prevHeight);
        connectPointsV2(prevPoint, point, woolColor);
      }
    }
  });

  const showMessage = `tellraw @a {"rawtext":[{"text":"§a§lLINE GRAPH VISUALIZED"}]}`;
  world.getDimension("overworld").runCommand(showMessage);
}

export function getCoordinatesForPoint(level, height){
  const x = LINE_baseX - (level - 1) * LINE_levelWidth;
  const y = LINE_baseY + height;
  const z = LINE_baseZ;

  return {x, y, z};
}

function connectPoints(point1, point2, woolType){
  const {x:x1, y:y1, z:z1} = point1;
  const {x:x2, y:y2, z:z2} = point2;

  if(y1 == y2){
    // case 1: same height
    const startX = Math.min(x1, x2) + 1;
    const endX = Math.max(x1, x2) - 1;
    for(let x = startX; x <= endX; x++){
        const placementPosition = getPlaceablePosition(x, y1, z1);
        placeBlock(placementPosition, woolType);
    }
  }else{
    // case 2: different heights
    const deltaX = x2 - x1;
    const deltaY = y2 - y1;
    const stepsX = Math.abs(deltaX);
    const stepsY = Math.abs(deltaY);

    const startX = x1 + Math.sign(deltaX);
    let endX = x2 - Math.sign(deltaX);
    const startY = y1 + Math.sign(deltaY);
    let endY = y2 - Math.sign(deltaY);

    if(stepsY == 1){
      endX = startX + Math.sign(deltaX);
      endY = startY;
    }
    const startPosition = getPlaceablePosition(startX, startY, z1);
    const endPosition = getPlaceablePosition(endX, endY, z1);
    placeBlock(startPosition, woolType);
    placeBlock(endPosition, woolType);

    const verticalSteps = Math.max(0, stepsY - 2);

    let lastVerticalY = startY;
    for(let i = 1; i <= verticalSteps; i++){
      const y = startY + i * Math.sign(deltaY);
      if(Math.abs(y - endY) <= 1){
        break;
      }
      const placementPosition = getPlaceablePosition(startX, y, z1);
      placeBlock(placementPosition, woolType);
      lastVerticalY = y;
    }

    if(Math.abs(lastVerticalY - endY) > 1){
      const y = endY - Math.sign(deltaY);
      const placementPosition = getPlaceablePosition(endX, y, z1);
      placeBlock(placementPosition, woolType);
    }
  }
}

export function connectPointsV2(point1, point2, woolType){
  const {x:x1, y:y1, z:z1} = point1;
  const {x:x2, y:y2, z:z2} = point2;

  if(y1 == y2){
    const startX = Math.min(x1, x2) + 1;
    const endX = Math.max(x1, x2) - 1;
    for(let x = startX; x <= endX; x++){
      const placementPosition = getPlaceablePosition(x, y1, z1);
      placeBlock(placementPosition, woolType);
    }
  }else{
    const deltaX = x2 - x1;
    const deltaY = y2 - y1;
    const stepsX = Math.abs(deltaX);
    const stepsY = Math.abs(deltaY);

    const startX = x1 + Math.sign(deltaX);
    let endX = x2 - Math.sign(deltaX);
    const startY = y1 + Math.sign(deltaY);
    let endY = y2 - Math.sign(deltaY);

    if(stepsY == 1){
      endX = startX + Math.sign(deltaX);
      endY = startY;
    }
    const startPosition = getPlaceablePosition(startX, startY, z1);
    const endPosition = getPlaceablePosition(endX, endY, z1);
    placeBlock(startPosition, woolType);
    placeBlock(endPosition, woolType);

    const verticalSteps = Math.max(0, stepsY - 2);
    let verticalBlocksFirst = Math.floor(verticalSteps / 2);
    let verticalBlocksSecond = verticalSteps - verticalBlocksFirst;

    if(verticalSteps == 1){
      verticalBlocksFirst = 0;
      verticalBlocksSecond = 0;
    }
    if(verticalSteps == 2){
      verticalBlocksFirst = 1;
      verticalBlocksSecond = 0;
    }

    for(let i = 1; i <= verticalBlocksFirst; i++){
      const y = startY + i * Math.sign(deltaY);
      const placementPosition = getPlaceablePosition(startX, y, z1);
      placeBlock(placementPosition, woolType);
    }

    if(verticalBlocksSecond > 0){
      verticalBlocksSecond--;
    }

    for(let i = 1; i <= verticalBlocksSecond; i++){
      const y = endY - i * Math.sign(deltaY);
      const placementPosition = getPlaceablePosition(endX, y, z1);
      placeBlock(placementPosition, woolType);
    }
  }
}



export function getPlaceablePosition(x, y, z){
 let currentZ = z;
 const dimension = world.getDimension("overworld");
 const allowedBlocks = ["minecraft:air", canvasBlock];
 const location = {x, y, z: currentZ};
 let blockType = dimension.getBlock(location).typeId;
 while(!allowedBlocks.includes(blockType)){
   currentZ--;
   location.z = currentZ;
   blockType = dimension.getBlock(location).typeId;
 }

  return {x, y, z: currentZ};
}

export function placeBlock(position, blockType){
  const {x, y, z} = position;
  const command = `setblock ${x} ${y} ${z} ${blockType}`;
  try{
    world.getDimension("overworld").runCommand(command);
  } catch(error){
    world.sendMessage(`Error: ${error}`);
  }
}

/**************************************************************************************************** */
//                                        SCATTERPLOT VISUALIZATION FUNCTIONS
/**************************************************************************************************** */

export function resetScatterplot(){
  const dimension = world.getDimension("overworld");
  const canvas = SCATTER_canvasCoordinates;
  const command = `fill ${canvas.x1} ${canvas.y1} ${canvas.z1 - 1} ${canvas.x2} ${canvas.y2} ${canvas.z2 - 3} minecraft:air`;
  try{
    dimension.runCommand(command);
    // const showMessage = `tellraw @a {"rawtext":[{"text":"§a§lSCATTERPLOT RESET"}]}`
    // dimension.runCommand(showMessage);
  } catch(error){
    world.sendMessage(`Error: ${error}`);
  }

  SCATTER_pointBlockData = [];
  disableScoreboardDisplay();
}

export function buildScatterplotGeneral(xData, yData, xLabel, yLabel, xUnit, yUnit){
  resetScatterplot();
  const woolColor = SCATTER_pointBlockList[0];

  const xScaleFactor = getScaleFactorGeneral(xData, SCATTER_maxWidth);
  const yScaleFactor = getScaleFactorGeneral(yData, SCATTER_maxHeight);

  const convertedValues = convertedXYValue(xData, yData, xScaleFactor, yScaleFactor);
  const convertedX = convertedValues.x;
  const convertedY = convertedValues.y;

  for(let i = 0; i < convertedX.length; i++){
    const x = convertedX[i];
    const y = convertedY[i];
    const point = getCoordinatesForPointGeneral(x, y);
    const placementPosition = getPlaceablePosition(point.x, point.y, point.z);
    placeBlock(placementPosition, woolColor);

    // query
    
    SCATTER_pointBlockData.push({
      position: placementPosition,
      xValue: xData[i],
      yValue: yData[i],
      xLabel: xLabel,
      yLabel: yLabel,
      xUnit: xUnit,
      yUnit: yUnit,
      blockType: null
    });

  }
  const showMessage = `tellraw @a {"rawtext":[{"text":"§a§lSCATTERPLOT VISUALIZED"}]}`;
  world.getDimension("overworld").runCommand(showMessage);
}


function convertedXYValue(xData, yData, xScaleFactor, yScaleFactor){
  const convertedX = xData.map((value) => Math.round(value * xScaleFactor));
  const convertedY = yData.map((value) => Math.round(value * yScaleFactor));
  const convertedValues = {
    x: convertedX,
    y: convertedY
  };
  return convertedValues;
}

function getCoordinatesForPointGeneral(x, y){
  const baseX = SCATTER_baseX;
  const baseY = SCATTER_baseY;
  const baseZ = SCATTER_baseZ;

  const pointX = baseX - x;
  const pointY = baseY + y;
  const pointZ = baseZ;

  return {x: pointX, y: pointY, z: pointZ};
}


function getScaleFactorGeneral(data, maxRange) {
  const maxCount = Math.max(...data);
  const minCount = Math.min(...data.filter((count) => count > 0));

  if (maxCount === 0) {
    return 1; // All values are zero, return a default scale factor of 1
  }

  const scaleFactorGeneral = maxRange / maxCount;

  return scaleFactorGeneral;
}

const pseudoXData = [0,4,8,12,16,20,24,28,32,36,40,42,44,46,48]
const pseudoYData = [0,1,0,1.5,2,2.5,3,3,2,2,2,2,1,0.5,0.5,1];

// Test general scatterplot visualization
world.afterEvents.chatSend.subscribe((eventData) => {
  let message = eventData.message;

  if(message === "scattertest"){
    buildScatterplotGeneral(pseudoXData, pseudoYData);
  }

  if(message === "testsf"){
    const xData = dataPoints.map(point => parseFloat(point.distance.toFixed(2)));
    const yData = dataPoints.map(point => parseFloat(point.averageBreakTime.toFixed(2)));
    const xScaleFactor = getScaleFactorGeneral(xData, SCATTER_maxWidth);
    const yScaleFactor = getScaleFactorGeneral(yData, SCATTER_maxHeight);
    world.sendMessage(`xScaleFactor: ${xScaleFactor}, yScaleFactor: ${yScaleFactor}`);
  }
});

// Mining Distance vs. Average Block Break Time
// Scatterplot visualization
function scatterplotBlockBreakTime(){
  const xData = dataPoints.map(point => parseFloat(point.distance.toFixed(2)));
  const yData = dataPoints.map(point => parseFloat(point.averageBreakTime.toFixed(2)));
  const xLabel = "Distance";
  const yLabel = "Avg Break Time";
  const xUnit = "";
  const yUnit = "s";
  buildScatterplotGeneral(xData, yData, xLabel, yLabel, xUnit, yUnit);
}



/**************************************************************************************************** */
//                                        MISCELLANEOUS FUNCTIONS
/**************************************************************************************************** */
let totalPlaced = 0;
let totalBroken = 0;
let lastUpdatedTime = 0;
let isFirstRound = {
  0: true,
  1: true,
  2: true,
  3: true
};

export function updateTypesAndCounts(blockType, isPlaced, level) {
  let blockCounts = initialBlockCountsByLevel[level - 1];

  if (isPlaced) {
    totalPlaced++;
    if (blockCounts[blockType]) {
      blockCounts[blockType]++;
    } else {
      blockCounts[blockType] = 1; // new block type
    }
  } else {
    totalBroken++;
    if (blockCounts[blockType] && blockCounts[blockType] > 1) {
      blockCounts[blockType]--;
    } else {
      delete blockCounts[blockType]; // remove block type
    }
  }


  // Update blockChangeData for each time period
  for (const timePeriod in blockChangeData) {
    if (!blockChangeData[timePeriod].specificBlocks[blockType]) {
      blockChangeData[timePeriod].specificBlocks[blockType] = Array(10).fill(0);
    }
  }
}

export const blockChangeData = {
  0: { specificBlocks: {}, overallBlockChange: Array(10).fill(0) }, // last 1 minute
  1: { specificBlocks: {}, overallBlockChange: Array(10).fill(0) }, // last 3 minutes
  2: { specificBlocks: {}, overallBlockChange: Array(10).fill(0) }, // last 5 minutes
  3: { specificBlocks: {}, overallBlockChange: Array(10).fill(0) }, // last 10 minutes
  4: { specificBlocks: {}, overallBlockChange: Array(10).fill(0) }, // last 15 minutes
  5: { specificBlocks: {}, overallBlockChange: Array(10).fill(0) }, // last 30 minutes
};

function updateBlockChangeData() {
  if (!timerActive) return;

  const currentTime = Math.floor(elapsedSeconds);

  for (const timePeriod in blockChangeData) {
    const { specificBlocks, overallBlockChange } = blockChangeData[timePeriod];
    const timeIntervalInSeconds = getTimeIntervalInSeconds(Number(timePeriod));
    const index = Math.floor(currentTime / timeIntervalInSeconds) % 10 - 1;

    if (currentTime !== lastUpdatedTime && currentTime % timeIntervalInSeconds === 0 && currentTime !== 0) {
      if (isFirstRound[timePeriod]) {
        overallBlockChange[index] = Math.abs(totalPlaced - totalBroken);

        for (const blockType in specificBlocks) {
          specificBlocks[blockType][index] = overallBlockChange[index];
        }

        if (index === 9) {
          isFirstRound[timePeriod] = false;
        }
      } else {
        overallBlockChange.shift();
        overallBlockChange.push(Math.abs(totalPlaced - totalBroken));

        for (const blockType in specificBlocks) {
          specificBlocks[blockType].shift();
          specificBlocks[blockType].push(overallBlockChange[overallBlockChange.length - 1]);
        }
      }
    }

    if (currentTime !== lastUpdatedTime && currentTime % (timeIntervalInSeconds * 10) === 0) {
      const updatedSpecificBlocks = {};
      for (const blockType in specificBlocks) {
        if (specificBlocks[blockType].some((count) => count > 0)) {
          updatedSpecificBlocks[blockType] = specificBlocks[blockType];
        }
      }

      // world.sendMessage(`Time Period: ${timePeriod}, Specific Blocks: ${JSON.stringify(updatedSpecificBlocks)}, Overall Block Change: ${JSON.stringify(overallBlockChange)}`);

      totalPlaced = 0;
      totalBroken = 0;
    }
  }

  lastUpdatedTime = currentTime;
}

system.runInterval(updateBlockChangeData, 20);

world.afterEvents.chatSend.subscribe((eventData) => {
  let message = eventData.message;

  if (message === "testdata"){
    world.sendMessage(`Block Change Data for 1min: ${JSON.stringify(blockChangeData[0])}`);
    world.sendMessage(`Block Change Data for 3min: ${JSON.stringify(blockChangeData[1])}`);
    world.sendMessage(`Block Change Data for 5min: ${JSON.stringify(blockChangeData[2])}`);
  }
});

function getTop8Counts(levelData){
  const entries = Object.entries(levelData);
  const sortedEntries = entries.sort((a,b) => b[1] - a[1]);
  const top8 = sortedEntries.slice(0,8);
  const top8Counts = Object.fromEntries(top8);

  return top8Counts;
}


function printLevelState(level){
  const blockCounts = initialBlockCountsByLevel[level - 1];
  world.sendMessage(`Current state at level ${level}: ${JSON.stringify(blockCounts)}`);
}

function getLevelData(level){
  return initialBlockCountsByLevel[level - 1];
}


function convertCountsToBlockHeights(levelData, maxHeight){
  const counts = Object.values(levelData);
  const maxCount = Math.max(...counts);
  const minCount = Math.min(...counts);
  const scaleFactor = getScaleFactor(maxCount, minCount, maxHeight);
  const blockHeights = {};
  for(const [blockType, count] of Object.entries(levelData)){
    blockHeights[blockType] = Math.round(count * scaleFactor);
    if(count > 0 && blockHeights[blockType] < 1){
      blockHeights[blockType] = 1;
    }
  }
  return blockHeights;
}


function getScaleFactor(maxCount, minCount, maxHeight){
  const range = maxCount - minCount;
  if(range === 0) return 1;
  const padding = 0.05;
  const paddedRange = range * (1 + padding * 2)
  let scaleFactor = maxHeight / paddedRange;

  const maxConvertedHeight = maxCount * scaleFactor;
  if(maxConvertedHeight > maxHeight){
    scaleFactor = maxHeight / maxCount;
  }

  return scaleFactor;
}

export function getLevelFromPosition(x,y,z){
  for(const level of levelBoundaries){
    if(x >= level.minX && x <= level.maxX && y == level.minY && z >= level.minZ && z <= level.maxZ){
      return level.level;
    }
  }
  return null;
}

function initializeCombinedBlockList(){
  const uniqueBlocks = new Set();
  for(let level = 0; level < initialBlockCountsByLevel.length; level++){
    const blockCounts = initialBlockCountsByLevel[level];
    for(const blockType in blockCounts){
      uniqueBlocks.add(blockType);
    }
  }
  combinedBlockList = Array.from(uniqueBlocks);
}


  function getFormattedBlockName(blockType){
    const adjustedName = blockType.replace("minecraft:","").replace("_"," ");
    const capitalized = adjustedName.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    return capitalized;
  }

function getScaleFactor2(levelCounts, maxHeight){
  let maxCount = 0;
  let minCount = Infinity;
  for(const blockType in levelCounts){
    const counts = levelCounts[blockType];
    const blockMaxCount = Math.max(...counts);
    const blockMinCount = Math.min(...counts.filter((count) => count > 0));
    maxCount = Math.max(maxCount, blockMaxCount);
    minCount = Math.min(minCount, blockMinCount);
  }
  const range = maxCount - minCount;
  if(range === 0) return 1;
  const padding = 0.05;
  const paddedRange = range * (1 + padding * 2);
  let scaleFactor = maxHeight / paddedRange;

  const maxConvertedHeight = maxCount * scaleFactor;
  if(maxConvertedHeight > maxHeight){
    scaleFactor = maxHeight / maxCount;
  }

  return scaleFactor;
}

function convertToHeight(blockCounts, selectedBlocks, scaleFactor){
  const convertedHeights = {};
  selectedBlocks.forEach((blockType) => {
    const counts = blockCounts[blockType];
    const heights = counts.map((count) => {
      if(count == 0) return 0;

      const height = Math.round(count * scaleFactor);
      return Math.max(height, 1);
    });
    convertedHeights[blockType] = heights;
  });
  return convertedHeights;
}

function getLevelCountsForSelectedBlocks(selectedBlocks){
  const levelCounts = {};
  selectedBlocks.forEach((blockType) => {
    levelCounts[blockType] = [];
    for(let level = 0; level < initialBlockCountsByLevel.length; level++){
      const count = initialBlockCountsByLevel[level][blockType] || 0;
      levelCounts[blockType].push(count);
    }
  });
  return levelCounts;
}

/**************************************************************************************************** */
//                                           VISUALIZATION FORMS
/**************************************************************************************************** */
  /**
   * Create a form to select the type of graph
   */
  function createVisualizationForm() {
  const form = new ActionFormData();
  form.title("Data Visualization");
  form.body("Choose the graph type");
  form.button("Bar Graph", "textures/items/iron_pickaxe");  // 0
  form.button("Line Graph", "textures/items/gold_pickaxe");  // 1
  form.button("Scatterplot", "textures/items/diamond_pickaxe"); // 2


    form.show(world.getAllPlayers()[0]).then((response) =>{
      if(response.canceled) return;
  
      switch(response.selection){
        case 0:
          barGraphSelection();
          break;
        case 1:
          lineGraphSelection();
          break;
        case 2:
          scatterplotSelection();
          break;
  
        default:
      }

    }).catch((error) => {
      console.error(`Error: ${error}`);
    });

}

function barGraphSelection(){
const form = new ActionFormData();
form.title("Bar Graph - Select Comparison");
form.body("Choose the type of comparison:");
form.button("Top 8 blocks at a certain level"); // 0
form.button("Block Diversity across levels"); // 1
form.button("Block Quantity across Levels"); // 2

form.show(world.getAllPlayers()[0]).then((response) => {
  if(response.canceled) return;
  switch(response.selection){
    case 0:
      createBarGraphForm();
      break;
    case 1:
      buildBlockDiversityBar();
      break;
    case 2:
      initializeCombinedBlockList();
      BlockQuantityBarForm();
      break;
    default:
  }
});
}

 function createBarGraphForm() {
  const form = new ModalFormData();
  form.title("Bar Graph Visualization");
  form.dropdown("Select Level",["1","2","3","4","5","6","7","8","9","10"], 0);
  form.dropdown("Color Theme",["Default", "Vibrant","Dark"], 0);
    form.show(world.getAllPlayers()[0]).then((response) =>{
      if(response.canceled) return;
  
      let [level, colorTheme] = response.formValues;
      const levelNumber = level + 1;
      
      const levelData = getLevelData(levelNumber);
      levelIndex = level;
      // top8_scoreBoard(levelData);
      buildBarGraph(levelData);
    }).catch((error) => {
      console.error(`Error: ${error}`);
    });
}

// Line Graph Selection
  function lineGraphSelection(){
    const form = new ActionFormData();
    form.title("Line Graph - Select Comparison");
    form.body("Choose the type of comparison:");
    form.button("Block change through time"); // 0
    form.button("Block change for certain blocks through time"); // 1
    form.button("Player distance through time"); // 2
    // Add more buttons for other comparisons

    form.show(world.getAllPlayers()[0]).then((response) => {
      if(response.canceled) return;
      switch(response.selection){
        case 0:
          blockChangeThroughTimeLine();
          break;
        case 1:
          initializeCombinedBlockList();
          blockChangeThroughTimeFormV2();
          break;
        case 2:
          playerDistanceFormV2();
        default:
      }
    }).catch((error) => {
      console.error(`Error: ${error}`);
    });
  }
   /**
   * Create a form to select block types for the line graph
   */
  function createLineGraphForm(){
  const form = new ModalFormData();
  form.title("Select Block Types");
  form.textField("Description", "Select up to three block types");
  const blockOptions = combinedBlockList.map((blockType) => getFormattedBlockName(blockType));
  blockOptions.forEach((blockName) => {
    form.toggle(blockName, false);
  });

  form.show(world.getAllPlayers()[0]).then((response) =>{
    if(response.canceled) return;

    const selectedBlocks = [];
    for(let i = 1; i < blockOptions.length + 1; i++){
      if(response.formValues[i]){
        const blockType = combinedBlockList[i - 1];
        selectedBlocks.push(blockType);
      }
    }

    if(selectedBlocks.length === 0){
      world.sendMessage("Please select at least one block type.");
      return;
    }else if(selectedBlocks.length > 3){
      world.sendMessage("Please select at most three block types.");
      return;
    }

    //world.sendMessage(`Selected blocks: ${selectedBlocks}`);

    const levelCounts = getLevelCountsForSelectedBlocks(selectedBlocks);
    const scaleFactor = getScaleFactor2(levelCounts, LINE_maxHeight);
    let convertedHeights = convertToHeight(levelCounts, selectedBlocks, scaleFactor);

    // visualize the line graph
    buildLineGraph(convertedHeights, selectedBlocks);

    // // for testing purposes
    // world.sendMessage(`Level counts: ${JSON.stringify(levelCounts)}`);
    // world.sendMessage(`scaleFactor: ${scaleFactor}`);
    // world.sendMessage(`Converted heights: ${JSON.stringify(convertedHeights)}`);
  });
}

// Scatterplot Selection
function scatterplotSelection(){
  const form = new ActionFormData();
  form.title("Scatterplot - Select Comparison");
  form.body("Choose the type of comparison:");
  form.button("Mining Distance vs. Average Block Break Time"); // 0 
  // Add more buttons for other comparisons

  form.show(world.getAllPlayers()[0]).then((response) => {
    if(response.canceled) return;
    switch(response.selection){
      case 0:
        scatterplotBlockBreakTime();
        break;
      case 1:
        break;
      default:
    }
  }).catch((error) => {
    console.error(`Error: ${error}`);
  });
}

/**************************************************************************************************** */
//                                           LOAD & SAVE FUNCTIONS
/**************************************************************************************************** */

function initialzeBlockCountsByLevel(){
  const savedData = world.getDynamicProperty('blockCounts');
  if(savedData){
    initialBlockCountsByLevel = JSON.parse(savedData);
  }
}

function saveBlockCountsToRegistry(){
  const data = JSON.stringify(initialBlockCountsByLevel);
  world.setDynamicProperty('blockCounts', data);
  world.sendMessage("Block counts saved to registry.");
}

world.afterEvents.chatSend.subscribe((eventData) => {
  let message = eventData.message;

  if(message === "save"){
    saveBlockCountsToRegistry();
  }
});

world.afterEvents.chatSend.subscribe((eventData) => {
  let message = eventData.message;

  if(message === "initialize"){
    initialBlockCountsByLevel = PRE_DEFINED_BLOCK_COUNTS;

    world.sendMessage("Block counts initialized.");
  }
});



function getBlockDiversityByLevel(){
  const blockDiversity = {};
  for(let level = 1; level <= 10; level++){
    const levelData = getLevelData(level);
    const blockTypes = Object.keys(levelData);
    blockDiversity[level] = blockTypes.length;
  }
  return blockDiversity;
}

/********************************************************************* */
//                            VISUALIZATION IDEAS
/********************************************************************* */
// Dynamic Scoreboard for BAR GRAPH
function dynamicScoreboard(title, data){
const dimension = world.getDimension("overworld");
dimension.runCommand(`scoreboard objectives remove dsb`);
dimension.runCommand(`scoreboard objectives add dsb dummy "§l§6${title}§r§r"`);
for(const [level, value] of Object.entries(data)){
  dimension.runCommand(`scoreboard players set "level ${level}" dsb ${value}`);
}

dimension.runCommand(`scoreboard objectives setdisplay sidebar dsb`);
}

// 1. Block Diversity across Levels - BAR GRAPH
function buildBlockDiversityBar() {
  const dimension = world.getDimension("overworld");
  resetBarGraphV2(); // reset the canvas before drawing the new graph
  
  const diversityCounts = getBlockDiversityByLevel();
  const blockHeights = convertCountsToBlockHeightsV2(diversityCounts, BAR_canvasMaxHeight);
  const values = Object.values(diversityCounts);
  const yPositionList = [];
  
  let barIndex = 0;
  for (const height of blockHeights) {
    const color = barColorv2[barIndex];
    const startX = startXY.x;
    const startY = startXY.y;
    const startZ = barStartZv2[barIndex];
    const endX = startX;
    const endY = startY + height;
    const endZ = startZ + 1;
    const command = `fill ${startX} ${startY} ${startZ} ${endX} ${endY} ${endZ} ${color}`;
    yPositionList.push(endY + 1);
    try {
      dimension.runCommand(command);
    } catch (error) {
      world.sendMessage(`Error: ${error}`);
    }
    
    barIndex++;
  }
  labelBarValues(values, yPositionList);
  const xLabel = "Level";
  const yLabel = "Unique Blocks";
  BARGraphXYLabelsV2(xLabel, yLabel);
  const categoryList = Object.keys(diversityCounts).map((level) => `Level ${level}`);
  labelBarGraphCategories(categoryList);
  const title = "Block Diversity across Levels";
  BARlabelGraphTitleV2(title);

  const showMessage = `tellraw @a {"rawtext":[{"text":"§a§lBLOCK DIVERSITY BAR GRAPH VISUALIZED"}]}`;
  dimension.runCommand(showMessage);
  // const title = "Level - Block Diversity";
  // dynamicScoreboard(title, diversityCounts);
}

function convertCountsToBlockHeightsV2(levelData, maxHeight){
  const counts = Object.values(levelData);
  const maxCount = Math.max(...counts);
  const minCount = Math.min(...counts);
  const scaleFactor = getScaleFactor(maxCount, minCount, maxHeight);
  const blockHeights = [];
  for(const count of counts){
    const convertedHeight = Math.round(count * scaleFactor);
    if(convertedHeight > 0 && convertedHeight < 1){
      blockHeights.push(1);
    }else if(convertedHeight == 0){
      blockHeights.push(0);
    }else{
      blockHeights.push(convertedHeight);
    }
  }
  return blockHeights;
}

// 2. Block Quantity across Levels - BAR GRAPH
function buildBlockQuantityBar(block){
  const dimension = world.getDimension("overworld");
  resetBarGraphV2();  // reset the canvas before drawing the new graph

  const levelCounts = getLevelCountsForBlock(block);
  const blockHeights = convertCountsToBlockHeightsV2(levelCounts, BAR_canvasMaxHeight);
  const values = Object.values(levelCounts);
  const yPositionList = [];
  let barIndex = 0;

  for(const height of blockHeights){
    const color = barColorv2[barIndex];
    const startX = startXY.x;
    const startY = startXY.y;
    const startZ = barStartZv2[barIndex];
    const endX = startX;
    const endY = startY + height;
    const endZ = startZ + 1;
    if(height > 0){
      const command = `fill ${startX} ${startY} ${startZ} ${endX} ${endY} ${endZ} ${color}`;
      dimension.runCommand(command);
    }
    yPositionList.push(endY + 1);
    barIndex++;
  }

  labelBarValues(values, yPositionList);
  const formattedBlockName = getFormattedBlockName(block);
  const xLabel = "Level";
  const yLabel = `${formattedBlockName} Quantity`;
  BARGraphXYLabelsV2(xLabel, yLabel);
  const categoryList = Object.keys(levelCounts).map((level) => `Level ${level}`);
  labelBarGraphCategories(categoryList);
  const title = `${formattedBlockName} Quantity across Levels`;
  BARlabelGraphTitleV2(title);

  const showMessage = `tellraw @a {"rawtext":[{"text":"§a§lBLOCK QUANTITY BAR GRAPH VISUALIZED"}]}`;
  dimension.runCommand(showMessage);
  // const title = `Level - Block Quantity`;
  // dynamicScoreboard(title, levelCounts);
}

function getLevelCountsForBlock(block){
const levelCounts = {};
for(let level = 1; level <= 10; level++){
  const count = initialBlockCountsByLevel[level - 1][block] || 0;
  levelCounts[level] = count;
}
return levelCounts;
}

function BlockQuantityBarForm(){
const form = new ModalFormData();
form.title("Select Block Type");
form.textField("Description", "Select a block type");
const blockOptions = combinedBlockList.map((blockType) => getFormattedBlockName(blockType));
blockOptions.forEach((blockName) => {
  form.toggle(blockName, false);
});

form.show(world.getAllPlayers()[0]).then((response) => {
  if(response.canceled) return;
  const selectedBlocks = [];
  for(let i = 1; i < blockOptions.length + 1; i++){
    if(response.formValues[i]){
      const blockType = combinedBlockList[i - 1];
      selectedBlocks.push(blockType);
    }
  }

  if(selectedBlocks.length === 0){
    world.sendMessage("Please select at least one block type.");
    return;
  }else if(selectedBlocks.length > 1){
    world.sendMessage("Please select only one block type.");
    return;
  }

  const selectedBlock = selectedBlocks[0];

  buildBlockQuantityBar(selectedBlock);
});

}

// 3. Overall Block Change in the Area through the Time - LINE GRAPH 
const mockBlockChangeData = {
  0: [5, 12, 8, 15, 20, 18, 25, 30, 28, 35],  // last 1 min
  1: [20, 25, 30, 35, 40, 45, 50, 55, 60, 65], // last 3 min
  2: [30, 35, 40, 45, 50, 55, 60, 65, 70, 75],  // last 5 min
  3: [40, 45, 50, 55, 60, 65, 70, 75, 80, 85],  // last 10 min
  4: [50, 55, 60, 65, 70, 75, 80, 85, 90, 95],  // last 15 min
  5: [60, 65, 70, 75, 80, 85, 90, 95, 100, 105] // last 30 min
};

const unitOfTime = {
  0: "s", // 1 minute
  1: "s", // 3 minutes
  2: "s", // 5 minutes
  3: "s", // 10 minutes
  4: "s", // 15 minutes
  5: "s"  // 30 minutes
};

function blockChangeThroughTimeLine() {
  const form = new ModalFormData();
  form.title("Block Change Through Time");
  form.dropdown("Select a time period", ["last 1 minute", "last 3 minutes", "last 5 minutes", "last 10 minutes", "last 15 minutes", "last 30 minutes"], 0);

  form.show(world.getAllPlayers()[0]).then((response) => {
    if (response.canceled) return;
    const [selectedTimePeriod] = response.formValues;
    const timeUnit = unitOfTime[selectedTimePeriod];
    
    const woolColors = LINE_buildBlockList;
    const pointColors = LINE_pointBlockList;

    resetLineGraph(); // reset the canvas before drawing the new graph

    const counts = blockChangeData[selectedTimePeriod].overallBlockChange;

    // const counts = mockBlockChangeData[selectedTimePeriod]; // for testing purposes
    const scaleFactor = getScaleFactor3(counts, LINE_maxHeight);
    const convertedHeights = convertHeightsV3(counts, scaleFactor);
    const pointColor = pointColors[0];
    const woolColor = woolColors[0];

    let firstPointPosition = null;

    for (let i = 0; i < counts.length; i++) {
      const time = (i + 1) * getTimeIntervalInSeconds(Number(selectedTimePeriod));
      const height = convertedHeights[i];
      const point = getCoordinatesForPoint(i + 1, height);
      const placementPosition = getPlaceablePosition(point.x, point.y, point.z);
      placeBlock(placementPosition, pointColor);

      LINE_pointBlockData.push({
       position: placementPosition,
       xValue: time,
       yValue: counts[i],
       xLabel: "Time",
       yLabel: "Block Change",
       xUnit: timeUnit
      });

      if(i == 0){
        firstPointPosition = placementPosition;
      }
      if (i > 0) {
        const prevHeight = convertedHeights[i - 1];
        const prevPoint = getCoordinatesForPoint(i, prevHeight);
        connectPointsV2(prevPoint, point, woolColor);
      }
    }
    if(firstPointPosition){
      const originPosition = {x: -2, y: -25, z: 137};
      connectOriginToFirstPoint(originPosition, firstPointPosition, woolColor);
    }
    
  });

  const showMessage = `tellraw @a {"rawtext":[{"text":"§a§lBLOCK CHANGE THROUGH TIME LINE GRAPH VISUALIZED"}]}`;
  world.getDimension("overworld").runCommand(showMessage);
}

export function getScaleFactor3(counts, maxHeight) {
  const maxCount = Math.max(...counts);
  const minCount = Math.min(...counts.filter((count) => count > 0));
  const range = maxCount - minCount;

  if (range === 0) {
    if (maxCount === 0) {
      return 1; // All values are zero, return a default scale factor of 1
    } else {
      return maxHeight / maxCount; // Adjust the scale factor to fit the maxCount within maxHeight
    }
  }

  const padding = 0.05;
  const paddedRange = range * (1 + padding * 2);
  let scaleFactor = maxHeight / paddedRange;

  const maxConvertedValue = maxCount * scaleFactor;
  if (maxConvertedValue > maxHeight) {
    scaleFactor = maxHeight / maxCount;
  }

  const minConvertedValue = minCount * scaleFactor;
  if (minConvertedValue < 1) {
    scaleFactor = 1 / minCount;
  }

  return scaleFactor;
}

export function convertHeightsV3(counts, scaleFactor) {
  const convertedHeights = counts.map((count) => {
    if (count == 0) return 0;

    const height = Math.round(count * scaleFactor);
    return Math.max(height, 1);
  });

  return convertedHeights;

}

function disableScoreboardDisplay(){
  const dimension = world.getDimension("overworld");
  dimension.runCommand(`function removeDisplay`);
}

function connectOriginToFirstPoint(originPosition, firstPointPosition, woolColor) {
  const { x: x1, y: y1, z: z1 } = originPosition;
  const { x: x2, y: y2, z: z2 } = firstPointPosition;

  const dx = x2 - x1;
  const dy = y2 - y1;
  const dz = z2 - z1;

  const steps = Math.max(Math.abs(dx), Math.abs(dy), Math.abs(dz));

  for (let i = 0; i < steps; i++) {
    const t = steps === 0 ? 0 : i / steps;
    const x = Math.round(x1 + t * dx);
    const y = Math.round(y1 + t * dy);
    const z = Math.round(z1 + t * dz);

    if (x === x2 && y === y2 && z === z2) {
      // Stop placing blocks when we reach the first point block's position
      break;
    }

    const placementPosition = getPlaceablePosition(x, y, z);
    placeBlock(placementPosition, woolColor);
  }
}

// 4. Certain Blocks Quantity Change through the Time - LINE GRAPH
function blockChangeThroughTimeFormV2() {
  const form = new ModalFormData();
  form.title("Select Block Types and Time Period");
  form.textField("Description", "Select up to three block types");

  const blockOptions = combinedBlockList.map((blockType) => getFormattedBlockName(blockType));
  blockOptions.forEach((blockName) => {
    form.toggle(blockName, false);
  });

  form.dropdown("Select a time period", ["last 1 minute", "last 3 minutes", "last 5 minutes", "last 10 minutes", "last 15 minutes", "last 30 minutes"], 0);

  form.show(world.getAllPlayers()[0]).then((response) => {
    if (response.canceled) return;

    const selectedBlocks = [];
    for (let i = 1; i < blockOptions.length + 1; i++) {
      if (response.formValues[i]) {
        const blockType = combinedBlockList[i - 1];
        selectedBlocks.push(blockType);
      }
    }

    if (selectedBlocks.length === 0) {
      world.sendMessage("Please select at least one block type.");
      return;
    } else if (selectedBlocks.length > 3) {
      world.sendMessage("Please select no more than three block types.");
      return;
    }

    const selectedTimePeriod = response.formValues[blockOptions.length + 1]; 
    specificBlockChangeThroughTimeLine(selectedBlocks, selectedTimePeriod);
    const showMessage = `tellraw @a {"rawtext":[{"text":"§a§lBLOCK CHANGE THROUGH TIME LINE GRAPH VISUALIZED"}]}`;
    world.getDimension("overworld").runCommand(showMessage);
  });
}
const mockSpecificBlockChangeData = {
  0: {
    "minecraft:stone": [1, 5, 10, 7, 5, 8, 12, 10, 14, 18],
    "minecraft:gold_ore": [7, 9 , 11, 14, 18, 20, 17, 15, 12, 10],
    "minecraft:grass_block": [15, 20, 25, 30, 35, 40, 45, 50, 55, 60],
  },
  1: {
    "minecraft:stone": [20, 25, 30, 35, 40, 45, 50, 55, 60, 65],
    "minecraft:gold_ore": [25, 30, 35, 40, 45, 50, 55, 60, 65, 70],
    "minecraft:grass_block": [30, 35, 40, 45, 50, 55, 60, 65, 70, 75],
  },
  2: {
    "minecraft:stone": [30, 35, 40, 45, 50, 55, 60, 65, 70, 75],
    "minecraft:gold_ore": [35, 40, 45, 50, 55, 60, 65, 70, 75, 80],
    "minecraft:grass_block": [40, 45, 50, 55, 60, 65, 70, 75, 80, 85],
  },
  3: {
    "minecraft:stone": [40, 45, 50, 55, 60, 65, 70, 75, 80, 85],
    "minecraft:gold_ore": [45, 50, 55, 60, 65, 70, 75, 80, 85, 90],
    "minecraft:grass_block": [50, 55, 60, 65, 70, 75, 80, 85, 90, 95],
  },

  4: {
    "minecraft:stone": [50, 55, 60, 65, 70, 75, 80, 85, 90, 95],
    "minecraft:gold_ore": [55, 60, 65, 70, 75, 80, 85, 90, 95, 100],
    "minecraft:grass_block": [60, 65, 70, 75, 80, 85, 90, 95, 100, 105],
  },

  5: {
    "minecraft:stone": [60, 65, 70, 75, 80, 85, 90, 95, 100, 105],
    "minecraft:gold_ore": [65, 70, 75, 80, 85, 90, 95, 100, 105, 110],
    "minecraft:grass_block": [70, 75, 80, 85, 90, 95, 100, 105, 110, 115],
  }

};
function specificBlockChangeThroughTimeLine(selectedBlocks, selectedTimePeriod) {
  const timeUnit = unitOfTime[selectedTimePeriod];
  const woolColors = LINE_buildBlockList;
  const pointColors = LINE_pointBlockList;

  resetLineGraph(); // reset the canvas before drawing the new graph

  selectedBlocks.forEach((blockType, index) => {
    const counts = mockSpecificBlockChangeData[selectedTimePeriod][blockType]; // for testing purposes
    // const counts = getBlockQuantityThroughTime(blockType, selectedTimePeriod);
    const scaleFactor = getScaleFactor3(counts, LINE_maxHeight);

    const convertedHeights = convertHeightsV3(counts, scaleFactor);

    const pointColor = pointColors[index];
    const woolColor = woolColors[index];

    let firstPointPosition = null;

    for (let i = 0; i < counts.length; i++) {
      const time = (i + 1) * getTimeIntervalInSeconds(selectedTimePeriod);
      const height = convertedHeights[i];

      const point = getCoordinatesForPoint(i + 1, height);
      const placementPosition = getPlaceablePosition(point.x, point.y, point.z);
      placeBlock(placementPosition, pointColor);

      LINE_pointBlockData.push({
        position: placementPosition,
        xValue: time,
        yValue: counts[i],
        xLabel: "Time",
        yLabel: "Block Change",
        xUnit: timeUnit,
        blockType: getFormattedBlockName(blockType)
      });

      if (i === 0) {
        firstPointPosition = placementPosition;
      }

      if (i > 0) {
        const prevHeight = convertedHeights[i - 1];
        const prevPoint = getCoordinatesForPoint(i, prevHeight);
        connectPointsV2(prevPoint, point, woolColor);
      }
    }

    if (firstPointPosition) {
      const originPosition = { x: -2, y: -25, z: 137 };
      connectOriginToFirstPoint(originPosition, firstPointPosition, woolColor);
    }
  });
}

function getTimeIntervalInSeconds(timePeriod){
  switch(timePeriod){
    case 0:
      return 6; // 1 minute
    case 1:
      return 18;  // 3 minutes
    case 2:
      return 30;  // 5 minutes
    case 3:
      return 60;  // 10 minutes
    case 4:
      return 90;  // 15 minutes
    case 5:
      return 180;  // 30 minutes
    default:
      return 6;
  }
}

function getBlockQuantityThroughTime(blockType, selectedTimePeriod) {
  const blockChangeDataForPeriod = blockChangeData[selectedTimePeriod].specificBlocks[blockType];
  if (blockChangeDataForPeriod) {
    return blockChangeDataForPeriod;
  }
  return Array(10).fill(0);
}


// 5. Player Distance from the area center through the time - LINE GRAPH
const areaCenter = { x: -44, y: -28, z: 100 };
const bufferSize = 1800; // 30 minutes
const playerDistanceData = {
  0: [], // 1 minute
  1: [], // 3 minutes
  2: [], // 5 minutes
  3: [], // 10 minutes
  4: [], // 15 minutes
  5: [], // 30 minutes
};

let playerDistanceTracker = null;

function initPlayerDistanceTracker() {
  const player = world.getPlayers()[0];
  if (player) {
    playerDistanceTracker = new PlayerDistanceTracker(areaCenter, bufferSize);
  }
}

function updatePlayerDistance() {
  if (!playerDistanceTracker) {
    initPlayerDistanceTracker();
    return;
  }

  const player = world.getPlayers()[0];
  if (player) {
    const playerPosition = player.location;
    playerDistanceTracker.addDistance(playerPosition);
  }
}

function updatePlayerDistanceData() {
  if (!playerDistanceTracker) {
    return;
  } else if (!timerActive) {
    return;
  }

  const { average, median, max } = playerDistanceTracker.getStatistics();

  // 1 minute (10 intervals of 6 seconds each)
  if(Math.floor(elapsedSeconds) % 6 === 0){
    playerDistanceData[0].push({ average, median, max });
    if(playerDistanceData[0].length > 10){
      playerDistanceData[0].shift();
    }
  }

  // 3 minutes (10 intervals of 18 seconds each)
  if (Math.floor(elapsedSeconds) % 18 === 0) {
    playerDistanceData[1].push({ average, median, max });
    if (playerDistanceData[1].length > 10) {
      playerDistanceData[1].shift();
    }
  }

  // 5 minutes (10 intervals of 30 seconds each)
  if (Math.floor(elapsedSeconds) % 30 === 0) {
    playerDistanceData[2].push({ average, median, max });
    if (playerDistanceData[2].length > 10) {
      playerDistanceData[2].shift();
    }
  }

  // 10 minutes (10 intervals of 60 seconds each)
  if (Math.floor(elapsedSeconds) % 60 === 0) {
    playerDistanceData[3].push({ average, median, max });
    if (playerDistanceData[3].length > 10) {
      playerDistanceData[3].shift();
    }
  }

  // 15 minutes (10 intervals of 90 seconds each)
  if (Math.floor(elapsedSeconds) % 90 === 0) {
    playerDistanceData[4].push({ average, median, max });
    if (playerDistanceData[4].length > 10) {
      playerDistanceData[4].shift();
    }
  }

  // 30 minutes (10 intervals of 180 seconds each)
  if (Math.floor(elapsedSeconds) % 180 === 0) {
    playerDistanceData[5].push({ average, median, max });
    if (playerDistanceData[5].length > 10) {
      playerDistanceData[5].shift();
    }
  }
}

system.runInterval(updatePlayerDistance, 20); // Update every second
system.runInterval(updatePlayerDistanceData, 20); // Update every second

function playerDistanceFormV2() {
  const form = new ModalFormData();
  form.title("Player Distance from Center over Time");

  form.dropdown("Select a time period", ["last 1 minute", "last 3 minutes", "last 5 minutes", "last 10 minutes", "last 15 minutes", "last 30 minutes"], 0);
  form.dropdown("Select statistical measure for player distance", ["average", "median", "max"], 0);

  form.show(world.getAllPlayers()[0]).then((response) => {
    if (response.canceled) return;

    const selectedTimePeriod = response.formValues[0];
    const selectedMeasure = response.formValues[1];

    playerDistanceThroughTimeLine(selectedTimePeriod, selectedMeasure);
  });
}

function playerDistanceThroughTimeLine(selectedTimePeriod, selectedMeasure) {
  const timeUnit = unitOfTime[selectedTimePeriod];
  const woolColors = LINE_buildBlockList;
  const pointColors = LINE_pointBlockList;
  
  resetLineGraph(); // reset the canvas before drawing the new graph
  
  // world.sendMessage(`Player Distance Data: ${JSON.stringify(playerDistanceData[selectedTimePeriod])}`);
  
  const measureKey = selectedMeasure === 0 ? "average" : selectedMeasure === 1 ? "median" : "max";
  
  const filteredData = playerDistanceData[selectedTimePeriod].filter((data) => data && data[measureKey] !== undefined);
  
  // world.sendMessage(`Filtered Data: ${JSON.stringify(filteredData)}`);
  
  const counts = filteredData.map((data) => data[measureKey]);
  
  // world.sendMessage(`Counts: ${JSON.stringify(counts)}`);

  const scaleFactor = getScaleFactor3(counts, LINE_maxHeight);
  const convertedHeights = convertHeightsV3(counts, scaleFactor);

  // world.sendMessage(`Converted Heights: ${JSON.stringify(convertedHeights)}`);
  // world.sendMessage(`Scale Factor: ${scaleFactor}`);

  const pointColor = pointColors[0];
  const woolColor = woolColors[0];

  let firstPointPosition = null;

  for (let i = 0; i < counts.length; i++) {
    const time = (i + 1) * getTimeIntervalInSeconds(selectedTimePeriod);
    const height = convertedHeights[i];

    if (height !== null) {
      const point = getCoordinatesForPoint(i + 1, height);
      const placementPosition = getPlaceablePosition(point.x, point.y, point.z);
      placeBlock(placementPosition, pointColor);

      LINE_pointBlockData.push({
        position: placementPosition,
        xValue: time,
        yValue: counts[i],
        xLabel: "Time",
        yLabel: "Player Distance",
        xUnit: timeUnit
      });

      // if (i === 0) {
      //   firstPointPosition = placementPosition;
      // }

      if (i > 0 && convertedHeights[i - 1] !== null) {
        const prevHeight = convertedHeights[i - 1];
        const prevPoint = getCoordinatesForPoint(i, prevHeight);
        connectPointsV2(prevPoint, point, woolColor);
      }
    }
  }

  if (firstPointPosition) {
    const originPosition = { x: -2, y: -25, z: 137 };
    connectOriginToFirstPoint(originPosition, firstPointPosition, woolColor);
  }

  const showMessage = `tellraw @a {"rawtext":[{"text":"§a§lPlayer Distance Through Time Line Graph Visualized"}]}`;
  world.getDimension("overworld").runCommand(showMessage);

}
// const mockPlayerDistanceData = {
//   0: [5, 10, 15, 20, 25, 30, 35, 40, 45, 50],
//   1: [10, 15, 20, 25, 30, 35, 40, 45, 50, 55],
//   2: [15, 20, 25, 30, 35, 40, 45, 50, 55, 60],
//   3: [20, 25, 30, 35, 40, 45, 50, 55, 60, 65],
// };

// Test text display
world.afterEvents.chatSend.subscribe((eventData) => {
  const message = eventData.message;
  const player = eventData.sender;
  if(message === "test text"){
    const playerPosition = player.location;
    const textPosition = {
      x: 1,
      y: -2,
      z: 95    
    };

    const formattedText = "§l23§r";
    const textDisplay = new TextDisplay(formattedText, textPosition);
    textDisplay.spawn();

    world.sendMessage("Floating text displayed.");
  }else if (message === "despawnAll"){
    TextDisplay.deleteAll();
    world.sendMessage("All floating texts despawned.");
  }
});

/********************************************************************* */
//                            LABELING W/ TEXT DISPLAY
/********************************************************************* */
// const BAR_colorCodes = ["§2","§3","§b","§e","§a","§4","§d","§1"]; // bar graph color codes for formatted texts
const BARLabelZ = [95, 98, 101, 104, 107, 110, 113, 116];
const BARLabelZV2 = [95, 98, 101, 104, 107, 110, 113, 116, 119, 122];
const BARLabelY = -26;
const BARLabelX = 1;
const barGraphTexts = []; // store the positions of texts used in the bar graph
const BARXLabelPosition = { x: 1, y: -27, z: 105 };
const BARXLabelPositionV2 = { x: 1, y: -27, z: 108 };
const BARYLabelPosition = { x: 1, y: -15, z: 92 };
const BAR_titlePosition = { x: 1, y: 1, z: 105 };
const BAR_titlePositionV2 = { x: 1, y: 1, z: 108};

// 1. Label XY Axis on the graph
function labelXYAxis(xLabel, yLabel, xPosition, yPosition){
  const formattedXLabel = `§l§b${xLabel}§r§r`;
  const formattedYLabel = `§l§b${yLabel}§r§r`;

  const xLabelDisplay = new TextDisplay(formattedXLabel, xPosition);
  xLabelDisplay.spawn();
  barGraphTexts.push(xPosition);

  const yLabelDisplay = new TextDisplay(formattedYLabel, yPosition);
  yLabelDisplay.spawn();
  barGraphTexts.push(yPosition);
}

function BARGraphXYLabels(xLabel, yLabel){
  const xpos = BARXLabelPosition;
  const ypos = BARYLabelPosition;
  labelXYAxis(xLabel, yLabel, xpos, ypos);
}

function BARGraphXYLabelsV2(xLabel, yLabel){
  const xpos = BARXLabelPositionV2;
  const ypos = BARYLabelPosition;
  labelXYAxis(xLabel, yLabel, xpos, ypos);
}

// 2. Label categorical variables on X-axis for bar graph
function labelBarGraphCategories(categories){
  const labelZ = categories.length <= 8 ? BARLabelZ : BARLabelZV2;

    if(categories.length > 8){
      categories.forEach((category, index) => {
        const formattedCategory = `${BAR_colorCodesv2[index]}${category}§r§r`;
        const categoryPosition = {
          x: BARLabelX,
          y: BARLabelY,
          z: labelZ[index]
        };
        const categoryDisplay = new TextDisplay(formattedCategory, categoryPosition);
        categoryDisplay.spawn();
        barGraphTexts.push(categoryPosition);
      });
    }else{
      categories.forEach((category, index) => {
        const formattedCategory = `${BAR_colorCodes[index]}${category}§r§r`;
        const categoryPosition = {
          x: BARLabelX,
          y: BARLabelY,
          z: labelZ[index]
        };
        const categoryDisplay = new TextDisplay(formattedCategory, categoryPosition);
        categoryDisplay.spawn();
        barGraphTexts.push(categoryPosition);
      });
    
    }

}

// 3. Label the values upon the bars for bar graph
function labelBarValues(values, positions) {
  const labelX = BARLabelX;
  const labelZ = values.length > 8 ? BARLabelZV2 : BARLabelZ;

  values.forEach((value, index) => {
    const formattedValue = `§l${value}§r`;
    const valuePosition = {
      x: labelX,
      y: positions[index],
      z: labelZ[index]
    };

    const valueDisplay = new TextDisplay(formattedValue, valuePosition);
    valueDisplay.spawn();
    barGraphTexts.push(valuePosition);
  });
}

// 4. Description of the bar graph (title, x-axis, y-axis)
const barDescPosTitle = { x: 1, y: 1, z: 105 };
const barDescPosXLabel = { x: 1, y: -27, z: 105 };
const barDescPosYLabel = { x: 1, y: -15, z: 92 };

// 5. Despawn all the texts used in the bar graph
function despawnAllBarGraphTexts(){
  barGraphTexts.forEach((position) => {
    TextDisplay.deleteAt(position);
  });
  barGraphTexts.length = 0;
}

// 6. Label the title of the bar graph
function BARlabelGraphTitle(title){
  const titlePosition = BAR_titlePosition;
  const formattedTitle = `§l§6${title}§r§r`;
  const titleDisplay = new TextDisplay(formattedTitle, titlePosition);
  titleDisplay.spawn();
  barGraphTexts.push(titlePosition);
}

function BARlabelGraphTitleV2(title){
  const titlePosition = BAR_titlePositionV2;
  const formattedTitle = `§l§6${title}§r§r`;
  const titleDisplay = new TextDisplay(formattedTitle, titlePosition);
  titleDisplay.spawn();
  barGraphTexts.push(titlePosition);
}

/********************************************************************* */
//                            GAMIFICATION (Mini-Games)
/********************************************************************* */
  // The Area Coordinates & Name
  const AREA_START = { x: -54, y: -27, z: 92 };
  const AREA_END = { x: -36, y: -17, z: 110 };
  const AREA_NAME = "the_area";

// Re-initialize the Area
import { saveStructure, loadStructure } from "./LoadNSave.js";

export function saveArea() {
    saveStructure(AREA_NAME, AREA_START, AREA_END);
}

export async function loadArea() {
    loadStructure(AREA_NAME, AREA_START);
}

world.afterEvents.chatSend.subscribe((eventData) => {
    const message = eventData.message.toLowerCase();
    if (message === "savearea") {
        saveArea();
        world.sendMessage("Area saved.");
    } else if (message === "loadarea") {
        loadArea();
        world.sendMessage("Area loaded.");
    }
});