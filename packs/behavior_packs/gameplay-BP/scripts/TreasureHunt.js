import { system, world } from "@minecraft/server";
import { updateTypesAndCounts, loadArea, saveArea } from "./Main.js"
import { resetDistanceData, updateDistanceData, startDistanceTracking, stopDistanceTracking, getDistanceData } from "./distanceTracker.js";
import { 
    resetLineGraph, 
    getScaleFactor3, 
    convertHeightsV3, 
    getCoordinatesForPoint, 
    getPlaceablePosition, 
    placeBlock, 
    connectPointsV2,
    LINE_pointBlockData,
    SCATTER_pointBlockData,
    buildScatterplotGeneral
  } from "./Main.js";

import { ActionFormData } from "@minecraft/server-ui";
import { getTreasureHuntScatterData, clearTreasureHuntData } from "./scatterplotData.js";

import { TextDisplayV2 } from "./TextDisplayV2.js";
import { MessageFormData } from "@minecraft/server-ui";

// let printInterval;

let floatingTexts = [];



const TREASURE_BLOCK = "minecraft:honey_block";
export let TREASURE_BLOCK_GENERATED = false;
export let TREASURE_BLOCK_FOUND = false;
export let TREASURE_BLOCK_POSITION = null;
export let TREASURE_BLOCK_AT_LEVEL = null;

export const GUIDE_ENTITY_ID = "mg:helper";
const GUIDE_ENTITY_POSITION = { x: -47, y: -27, z: 120 };

let GUIDE_ENTITY = null;
let HELPER2_ENTITY = null;

export let currentGuidanceStage = 0;


export let TREASURE_HUNT_IN_PROGRESS = false;


const COMPLETE_TITLE_COMMAND = [
    '/titleraw @a subtitle {"rawtext":[{"text":"§fYou found the"},{"text":"§6§l HONEY BLOCK"},{"text":"§r"}]}',
    '/titleraw @a title {"rawtext":[{"text":"§a§lCONGRATULATIONS!"}]}'
];

// Preset scenarios (level: [x, y, z])
const SCENARIOS = [
    { level: 5, position: [-45, -23, 99] },
    { level: 3, position: [-46, -25, 98] },
    { level: 4, position: [-45, -24, 101] },
    { level: 2, position: [-45, -26, 100] }
];

// Test scenario
const TEST_SCENARIO = { level: 1, position: [-53, -27, 109] };

/**===================================================================================================================== */
// FUNCTIONS

/**
 * Start the treasure hunt game
 */

let mainLoopId = null;  // Stores the id of the main loop interval

export async function startTreasureHunt() {
    if(TREASURE_HUNT_IN_PROGRESS) {
        world.sendMessage("Treasure hunt is already in progress!");
        return;
    }
    currentGuidanceStage = 0;  // Reset the guidance stage
    await setupTreasureHunt();
    provideIntroduction();  // Show introduction title and messages
    mainLoopId = system.runInterval(mainLoop, 20);
}

async function setupTreasureHunt() {
    TREASURE_HUNT_IN_PROGRESS = true;
    await resetArea();
    await new Promise(resolve => system.runTimeout(resolve, 20));

    generateTreasureBlock();
    resetDistanceData();
    startDistanceTracking();
    spawnGuide();

    // printInterval = system.runInterval(() => {
    //     printDistanceData();

    // }, 200);
}

function endTreasureHunt() {
    titleEnd();
   system.runTimeout(() => {
    clearAllFloatingTexts();
    removeGuide();
    if(mainLoopId !== null) {
        system.clearRun(mainLoopId);  // clear the main loop interval
        mainLoopId = null;
    }
    stopDistanceTracking();
    // system.clearRun(printInterval);
    // world.sendMessage("Treasure hunt ended!");
    // printDistanceData();
    const finalData = getDistanceData();

    // Final Visualizations
    buildTreasureHuntScatterplot();
    distanceLineGraphForTreasureHunt();
    world.sendMessage("§a§l[Game]§r: Treasure hunt completed! Check the visualizations for insights.");
   }, 100);  // 5 seconds delay (100 ticks)
    clearTreasureHuntData();
    TREASURE_HUNT_IN_PROGRESS = false;
}


export async function resetArea() {
  TREASURE_BLOCK_GENERATED = false;
  TREASURE_BLOCK_FOUND = false;
  TREASURE_BLOCK_POSITION = null;
  TREASURE_BLOCK_AT_LEVEL = null;

    await loadArea();

}

export function generateTreasureBlock() {
    if(TREASURE_BLOCK_GENERATED) {
        return;
    }

    // const selectedScenario = SCENARIOS[Math.floor(Math.random() * SCENARIOS.length)];
    const selectedScenario = TEST_SCENARIO;

    const [x, y, z] = selectedScenario.position;
    const level = selectedScenario.level;
    const overworld = world.getDimension("overworld");
    const block = overworld.getBlock({ x, y, z });
    
    if(block && block.typeId !== "minecraft:air" && block.typeId !== "minecraft:grass_block") {
        updateTypesAndCounts(block.typeId, false, level);

        block.setType(TREASURE_BLOCK);
        updateTypesAndCounts(TREASURE_BLOCK, true, level);

        TREASURE_BLOCK_GENERATED = true;
        TREASURE_BLOCK_POSITION = { x, y, z };
        TREASURE_BLOCK_AT_LEVEL = level;

        // world.sendMessage(`Treasure block generated at ${x}, ${y}, ${z} (level ${level})`);

    }

}
const GUIDE_STANDING_AREA = {x1: -48, x2: -45, y1: -28, y2: -28, z1: 119, z2: 120};
export const HELPER2_ENTITY_ID = "mg:helper2";
const HELPER2_ENTITY_POSITION = { x: -45, y: -27, z: 120 };
function spawnGuide(){
    // Spawn guide entity
    const overworld = world.getDimension("overworld");
    const fillCommand = `/fill ${GUIDE_STANDING_AREA.x1} ${GUIDE_STANDING_AREA.y1} ${GUIDE_STANDING_AREA.z1} ${GUIDE_STANDING_AREA.x2} ${GUIDE_STANDING_AREA.y2} ${GUIDE_STANDING_AREA.z2} minecraft:yellow_wool`;
    overworld.runCommandAsync(fillCommand);
    overworld.spawnEntity(GUIDE_ENTITY_ID, GUIDE_ENTITY_POSITION);
    // add name tag to the entity
    const nameTag = "§e§lGUIDE";
    const entities = overworld.getEntities({
        type: GUIDE_ENTITY_ID,
        position: GUIDE_ENTITY_POSITION
    });
    entities.forEach(entity => entity.nameTag = nameTag);
    GUIDE_ENTITY = entities[0];


    overworld.spawnEntity(HELPER2_ENTITY_ID, HELPER2_ENTITY_POSITION);
    const helperEntities = overworld.getEntities({
        type: HELPER2_ENTITY_ID,
        location: HELPER2_ENTITY_POSITION
    });
    helperEntities.forEach(entity => entity.nameTag = "§b§l^_^");
    HELPER2_ENTITY = helperEntities[0];
}

function removeGuide(){
    // Remove guide entity
    const overworld = world.getDimension("overworld");
    const fillCommand = `/fill ${GUIDE_STANDING_AREA.x1} ${GUIDE_STANDING_AREA.y1} ${GUIDE_STANDING_AREA.z1} ${GUIDE_STANDING_AREA.x2} ${GUIDE_STANDING_AREA.y2} ${GUIDE_STANDING_AREA.z2} minecraft:grass_block`;
    overworld.runCommandAsync(fillCommand);
    const entities = overworld.getEntities({
        type: GUIDE_ENTITY_ID,
        position: GUIDE_ENTITY_POSITION
    });
    entities.forEach(entity => entity.kill());

    const helperEntities = overworld.getEntities({
        type: HELPER2_ENTITY_ID,
        location: HELPER2_ENTITY_POSITION
    });
    helperEntities.forEach(entity => entity.kill());
}

function detectGameEnd(){
   // Treasure block is found(destroyed/replaced/collected)
    if(TREASURE_BLOCK_POSITION){
        const overworld = world.getDimension("overworld");
        const block = overworld.getBlock(TREASURE_BLOCK_POSITION);
        if(block.typeId !== TREASURE_BLOCK){
            TREASURE_BLOCK_FOUND = true;
            return true;
        }else{
            return false;
        }
    }
}


function titleEnd(){
    // show end title
    const overworld = world.getDimension("overworld");
    COMPLETE_TITLE_COMMAND.forEach(command => overworld.runCommandAsync(command));
}

export function onBlockMined(blockPosition){
    updateDistanceData(blockPosition);
}


const LINE_buildBlockList = ["minecraft:yellow_wool", "minecraft:light_blue_wool", "minecraft:green_wool"]; // block types for the lines
const LINE_pointBlockList = ["minecraft:orange_wool", "minecraft:blue_wool","minecraft:lime_wool"]; // block types for the points
const LINE_maxHeight = 23;

export function distanceLineGraphForTreasureHunt() {
  const woolColors = LINE_buildBlockList;
  const pointColors = LINE_pointBlockList;
  
  resetLineGraph();
  
  const distanceData = getDistanceData();
  
  const counts = distanceData.map(data => Number(data.distance.toFixed(2)));
  const times = distanceData.map(data => Number(data.time.toFixed(2)));

  const scaleFactor = getScaleFactor3(counts, LINE_maxHeight);
  const convertedHeights = convertHeightsV3(counts, scaleFactor);

  const pointColor = pointColors[0];
  const woolColor = woolColors[0];

  let firstPointPosition = null;

  for (let i = 0; i < counts.length; i++) {
    const time = times[i];
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
        yLabel: "Distance",
        xUnit: "s"
      });

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
  const showMessage = `tellraw @a {"rawtext":[{"text":"§a§lDistance from the treasure block through time visualized"}]}`;
  world.getDimension("overworld").runCommand(showMessage);
}

function showVisualizationForms(){
    const form = new ActionFormData();
    form.title("Treasure Hunt - Data Visualizations");
    form.body("Select a visualization to display:\n\n§a§lLINE GRAPH§r§r §l/§r §b§lSCATTER PLOT§r§r\n");
    form.button("§a§lLINE§r§r: Distance from the treasure block through time", "textures/ui/icon_book_writable");
    form.button("§b§lSCATTER§r§r: Mining Distance vs. Distance from the treasure block", "textures/ui/icon_book_writable");

    form.show(world.getAllPlayers()[0]).then((response) => {
        if(response.canceled) return;

        switch(response.selection){
            case 0:
                distanceLineGraphForTreasureHunt();
                break;

            case 1:
                buildTreasureHuntScatterplot();
                break;
            
            default:
        }
    }).catch((error) => {
        world.sendMessage(`Error: ${error}`);
    });
}

// MANUAL COMMANDS
world.afterEvents.chatSend.subscribe((event) => {
    const message = event.message;
    if(message === "reset") {
        resetArea();
    } else if(message === "generate") {
        generateTreasureBlock();
    }
    else if(message === "stage"){
        world.sendMessage(`Current guidance stage: ${currentGuidanceStage}`);
    }
});

// VISUALIZATION FUNCTIONS
export function getScatterPlotData(){
    return getTreasureHuntScatterData();
}

function buildTreasureHuntScatterplot(){
    const scatterData = getTreasureHuntScatterData();

    if(scatterData.length === 0) {
        world.sendMessage("No data is collected yet.");
        return;
    }

    const miningDistances = scatterData.map(data => data.miningDistance);
    const treasureDistances = scatterData.map(data => data.treasureDistance);

    buildScatterplotGeneral(
        miningDistances,
        treasureDistances,
        "Mining Distance",
        "Treasure Distance",
        "",
        ""
    );
  
}

// =====================================================================================================================
// GUIDANCE FUNCTIONS


function showCurrentGuidance(){
    switch(currentGuidanceStage){
        case 0:
            showIntroductionForm();
            break;
        case 1:
            showExplorationForm();
            break;
        case 2:
            showDataVizForm();
            break;
        case 3:
            showMidGameGuidanceForm();
            break;
        case 4:
            showFinalApproachForm();
            break;
    }
}

function provideIntroduction() {
    const titleCommand1 = `titleraw @a subtitle {"rawtext":[{"text":"§fFind the "},{"text":"§6§lHONEY BLOCK"},{"text":"§r§f in the site"}]}`;
    const titleCommand2 = `titleraw @a title {"rawtext":[{"text":"§6§lTREASURE"},{"text":"§e§l HUNT"}]}`;
    
    world.getDimension("overworld").runCommand(titleCommand1);
    world.getDimension("overworld").runCommand(titleCommand2);
    
    system.runTimeout(() => {
        world.sendMessage("§a§l[Game]§r§r: §fTreasure Hunt is in progress.");
        world.sendMessage("§a§l[Game]§r§r: §fYou can interact with §l§eGUIDE§r§f to get more info and tips.");
    }, 120);  // 5 seconds delay (100 ticks)
}


function showIntroductionForm() {
    const form = new MessageFormData()
        .title("Introduction")
        .body("§l§eWelcome to Treasure Hunt!§r\n\n" +
              "§l- Your goal§r: Find and collect the hidden §6honey block§r in the Mining Site.\n" +
              "§l- No time limit§r: Explore at your own pace.\n" +
              "§l- GUIDE§r: I'll provide tips and information throughout your journey.\n" +
              "§l- Data visualizations§r: Use them to aid your search.\n\n" +
              "Remember, every action you take generates valuable data!\n\n" +
              "Click §lOK§r to close this message, or §lNext >§r to learn how to get started.")
        .button1("Next >")
        .button2("OK");

    form.show(world.getAllPlayers()[0]).then((response) => {
        if (response.selection === 0) {  // Next > button
            currentGuidanceStage++;
            showCurrentGuidance();
        }
    });
}

function showExplorationForm() {
    const form = new MessageFormData()
        .title("Get Started")
        .body("§l§eTime to begin your treasure hunt!§r\n\n" +
              "§l§aStart by exploring and mining blocks in the area\n§r§r" +
              "§l1.§r Every block you mine is recorded as 'data' in our dataset.\n" +
              "§l2.§r This data forms patterns that can guide you to the treasure.\n" +
              "§l3.§r Soon, you'll learn how to visualize this data into meaningful graphs.\n" +
              "§l4.§r These visualizations will help you interpret trends and make predictions.\n\n" +
              "Remember: The more you mine, the more data you collect, and the closer you get to understanding the treasure's location!\n\n" +
              "Click §lOK§r to close, or §lNext >§r to learn about data visualization.")
        .button1("Next >")
        .button2("OK");

    form.show(world.getAllPlayers()[0]).then((response) => {
        if (response.selection === 0) {  // Next > button
            currentGuidanceStage++;
            showCurrentGuidance();
        }
    });
}

function showDataVizForm() {
    const form = new MessageFormData()
        .title("Use Data Visualization")
        .body("§l§eUnlock the power of data!§r\n\n" +
              "You have a §l§aVISUALIZER§r§r in your inventory bar. Use it to explore various data visualizations.\n\n" +
              "§lSuggestion:§r\n" +
              "Select §a'Bar Graph'§r to generate insightful visualizations.\n\n" +
              "§lWhy Bar Graphs?§r\n" +
              "- Excellent for comparing multiple categories\n" +
              "- Helps visualize block distribution across the 10 levels of the Mining Site\n" +
              "- Allows you to analyze each level's composition\n\n" +
              "§lReminder:§r\n" +
              "If you feel overwhelmed and need more guidance, click §lMore tips§r for additional help.\n\n" +
              "Click §lOK§r to close, or §lMore tips§r for extra assistance.")
        .button1("More tips")
        .button2("OK");

    form.show(world.getAllPlayers()[0]).then((response) => {
        if (response.selection === 0) {  // More tips button
            showMoreTipsForm();
            tip1Provided = true;
        } else {
            provideExplorationGuide();
            HELPER2_ENTITY.nameTag = "§b§lNeed\n§b§ladditional help?§r";
            currentGuidanceStage++;
        }
    });
}


let floatingText1, floatingText2;
function provideExplorationGuide() {
    world.sendMessage("§a§l[Game]§r: Right-click §a§lVISUALIZER§r to open the §eVisualization Form§r and explore visualizations, especially bar graphs.");
    
    floatingText1 = new TextDisplayV2("Use §a§lVISUALIZER§r§r\n for insights!", { x: -49, y: -26, z: 119 });
    floatingText1.spawn();
    floatingTexts.push(floatingText1);

    floatingText2 = new TextDisplayV2("After initial exploration,\ninteract with §e§lGUIDE§r to move to the next step.", { x: -50, y: -27, z: 119 });
    system.runTimeout(() => {
        floatingText2.spawn();
        floatingTexts.push(floatingText2);
    }, 30);

}

function showMoreTipsForm() {
    const form = new MessageFormData()
        .title("Advanced Tips")
        .body("§l§eUnlock the secrets of the honey block!§r\n\n" +
              "When selecting visualizations for bar graphs, try §l'Block Quantity across Levels'§r.\n\n" +
              "§lStep-by-step guide:§r\n" +
              "1. Choose §l'Block Quantity across Levels'§r\n" +
              "2. Select §l§6'Honey Block'§r§r from the options\n" +
              "3. Visualize the data\n\n" +
              "§lResult:§r You'll clearly see which level contains the honey block!\n\n" +
              "This powerful insight will significantly narrow down your search area.\n\n" +
              "Click §lOK§r to close and proceed to mid-game guidance, or §l< Previous§r to return to the main visualization tips.")
        .button1("OK")
        .button2("< Previous");

    form.show(world.getAllPlayers()[0]).then((response) => {
        if (response.selection === 0) {  // OK button
            currentGuidanceStage++;
            provideExplorationGuide();
        } else {
            showDataVizForm();  // Go back to the previous form
        }
    });
    }


function mainLoop() {
    if(!TREASURE_HUNT_IN_PROGRESS) return;
    if(detectGameEnd()) {
        endTreasureHunt();
    }
    if(tip1Provided && currentGuidanceStage === 3) {
        HELPER2_ENTITY.nameTag = "§b§lDoto";
    }
}



function addFloatingText(text, position) {
    const floatingText = new TextDisplayV2(text, position);
    floatingText.spawn();
    floatingTexts.push(floatingText);
    return floatingText;
}

function removeFloatingText(floatingText) {
    const index = floatingTexts.indexOf(floatingText);
    if (index > -1) {
        floatingText.despawn();
        floatingTexts.splice(index, 1);
    }
}

function clearAllFloatingTexts() {
    floatingTexts.forEach(text => text.despawn());
    floatingTexts = [];
}

let tip1Provided = false;

function handleDotoInteraction(player) {
    if (currentGuidanceStage >= 4) {
        showVisualizationForms();
    } 
    else if(currentGuidanceStage === 3 && !tip1Provided) {
        showMoreTipsForm();
    }
    else {
        const dotoMessages = [
            "§l§b[Doto]§r§r: ^-^ ♪♫♬",
            "§l§b[Doto]§r§r: (੭ु>▿<)੭ु⁾⁾",
            "§l§b[Doto]§r§r: ヾ(•ω•`)o",
            "§l§b[Doto]§r§r: (ﾉ◕ヮ◕)ﾉ*:･ﾟ✧",
            "§l§b[Doto]§r§r: ໒( ◑ω◑ )७"
        ];
        const randomMessage = dotoMessages[Math.floor(Math.random() * dotoMessages.length)];
        player.sendMessage(randomMessage);
    }
}

world.beforeEvents.playerInteractWithEntity.subscribe((event) => {
    const entity = event.target;
    const player = event.player;
    
    if (entity.typeId === GUIDE_ENTITY_ID) {
        system.runTimeout(() => {
            showCurrentGuidance();
        }, 1);
    } else if (entity.typeId === HELPER2_ENTITY_ID) {
        system.runTimeout(() => {
            handleDotoInteraction(player);
        }, 1);
    }
});

function showMidGameGuidanceForm() {
    const form = new MessageFormData()
        .title("Mid-Game Guidance")
        .body("§l§eTime to use advanced visualizations!§r\n\n" +
              "We have two powerful tools to help you locate the treasure:\n\n" +
              "§l1. Line Graph:§r Distance from the treasure block through time\n" +
              "§l2. Scatterplot:§r Mining Distance vs. Distance from the Treasure Block\n\n" +
              "These visualizations will give you crucial insights into your progress and the treasure's location.\n\n" +
              "Click §lOpen the Selections§r to view these visualizations now, or §lOK§r to continue exploring.")
        .button1("Open the Selections")
        .button2("OK");

    form.show(world.getAllPlayers()[0]).then((response) => {
        if (response.selection === 0) {  // Open the Selections button
            showVisualizationForms();
        }
        // Move to the next stage regardless of the button clicked
        if(currentGuidanceStage === 3) {
            currentGuidanceStage++;
        }
        updateDotoNameTag();
        showFloatingTextForDoto();
        if(currentGuidanceStage === 3){
            floatingText2.setText("Mining behavior is recorded.\n Visualize the graphs for analysis.");
        }
    });
}

function updateDotoNameTag() {
    const overworld = world.getDimension("overworld");
    const helperEntities = overworld.getEntities({
        type: HELPER2_ENTITY_ID,
        location: HELPER2_ENTITY_POSITION
    });
    helperEntities.forEach(entity => {
        if(currentGuidanceStage === 4) {
            entity.nameTag = "§b§lDoto";
        }
    });
}

function showFloatingTextForDoto() {
    const floatingText = new TextDisplayV2("Interact with §b§lDoto§r§r\nto open the visualization form", { x: -43, y: -26, z: 119 });
    floatingText.spawn();
    floatingTexts.push(floatingText);
}

world.afterEvents.itemUse.subscribe((eventData) => {
    if(eventData.itemStack.typeId === "minecraft:compass") {
        showVisualizationForms();
    }
  });

  function showFinalApproachForm() {
    const form = new MessageFormData()
        .title("Final Approach")
        .body("§l§eTime to analyze your data and find the treasure!§r\n\n" +
              "§c§lReminder:§r Before proceeding, ensure you've generated and examined the graphs.\n\n" +
              "§l§aGain insights from your visualizations:§r\n\n" +
              "§l1. Line Graph Analysis:§r\n" +
              "   • Observe the overall trend\n" +
              "   • Are you getting closer to or farther from the treasure?\n" +
              "   • Look for sudden changes in distance\n\n" +
              "§l2. Scatterplot Interpretation:§r\n" +
              "   • Is there a relationship between mining distance and treasure distance?\n" +
              "   • Look for clusters or patterns in the data points\n" +
              "   • Can you predict where to mine next based on this relationship?\n\n" +
              "§l§dMake decisions and predictions:§r\n" +
              "• Use these insights to guide your final search\n" +
              "• Predict the treasure's location based on your data analysis\n" +
              "• Trust your interpretations and make informed mining choices\n\n" +
              "You're close to victory! Use your data skills to uncover the treasure and complete your journey.\n\n" +
              "Click §lGo§r to continue your search, or §l< Previous§r to review mid-game guidance.")
        .button1("Go")
        .button2("< Previous");

    form.show(world.getAllPlayers()[0]).then((response) => {
        if (response.selection === 1) {  // < Previous button
            showMidGameGuidanceForm();
        } else {
            // End the guidance
            // currentGuidanceStage++;
            floatingText2.setText("You are approaching the treasure.\nUse data insights to guide your search.");
            world.sendMessage("§a§l[Game]§r: You're on your own now. Good luck finding the treasure!");
        }
    });
}