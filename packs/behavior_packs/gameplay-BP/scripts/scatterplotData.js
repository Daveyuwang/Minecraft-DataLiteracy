import { world } from "@minecraft/server";
import { elapsedSeconds, elapsedMilliseconds } from "./Timer.js";
import { TREASURE_BLOCK_POSITION, TREASURE_HUNT_IN_PROGRESS } from "./TreasureHunt.js";

let firstBlockPos = null;
let totalBlocksMined = 0;
let lastBreakTime = 0;
const data = [];
const dataPoints = [];
const maxDataPoints = 15;
let firstBlockPos2 = null;

function calculateDistanceFromStart(currentPos) {
  if (!firstBlockPos) return 0;

  const dx = currentPos.x - firstBlockPos.x;
  const dy = currentPos.y - firstBlockPos.y;
  const dz = currentPos.z - firstBlockPos.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

function calculateAverageBreakTime(startIndex, endIndex) {
  const blocksInInterval = data.slice(startIndex, endIndex);
  const sum = blocksInInterval.reduce((total, entry) => total + entry.breakTime, 0);
  return sum / blocksInInterval.length;
}

function updateDataPoints() {
  if (totalBlocksMined <= maxDataPoints) {
    dataPoints.length = 0;
    dataPoints.push(...data.map(entry => ({
      distance: entry.distance,
      averageBreakTime: entry.breakTime
    })));
  } else {
    const remainingBlocks = totalBlocksMined - maxDataPoints;
    let intervalSize = Math.ceil(remainingBlocks / maxDataPoints) + 1;
    let pointsToUpdate = Math.min(remainingBlocks, maxDataPoints);

    for (let i = maxDataPoints - 1; i >= maxDataPoints - pointsToUpdate; i--) {
      const startIndex = totalBlocksMined - (maxDataPoints - i) * intervalSize;
      const endIndex = Math.min(startIndex + intervalSize, totalBlocksMined);
      
      if (startIndex >= 0 && endIndex <= data.length) {
        const averageBreakTime = calculateAverageBreakTime(startIndex, endIndex);
        const distance = data[endIndex - 1].distance;

        dataPoints[i] = { distance, averageBreakTime };
      }
    }
  }

  dataPoints.forEach(point => {
    point.distance = parseFloat(point.distance.toFixed(2));
    point.averageBreakTime = parseFloat(point.averageBreakTime.toFixed(3));
  });

}

world.afterEvents.playerBreakBlock.subscribe((event) => {
  const currentBlockPos = event.block.location;

  if (!firstBlockPos) {
    firstBlockPos = currentBlockPos;
  }

  const breakTime = (elapsedMilliseconds - lastBreakTime) / 1000;
  lastBreakTime = elapsedMilliseconds;
  // world.sendMessage(`Break Time: ${breakTime} seconds`);

  const distance = calculateDistanceFromStart(currentBlockPos);
  data.push({ distance, breakTime });

  totalBlocksMined++;
  updateDataPoints();

  // Output test data
  // world.sendMessage(`Total Blocks Mined: ${totalBlocksMined}`);

  // world.sendMessage("Data Points:");
  // dataPoints.forEach((point, index) => {
  //   world.sendMessage(`Point ${index + 1}:`);
  //   world.sendMessage(`  Distance: ${point.distance.toFixed(2)}`);
  //   world.sendMessage(`  Average Break Time: ${point.averageBreakTime.toFixed(2)} seconds`);
  // });

  // world.sendMessage("---");
});

const treasureHuntData = [];
const treasureHuntDataPoints = 15;

function calculateDistanceFromTreasure(currentPos){
  if(!TREASURE_BLOCK_POSITION) return 0;
  const dx = currentPos.x - TREASURE_BLOCK_POSITION.x;
  const dy = currentPos.y - TREASURE_BLOCK_POSITION.y;
  const dz = currentPos.z - TREASURE_BLOCK_POSITION.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

function updateTreasureHuntDataPoints(){
  if(treasureHuntData.length > treasureHuntDataPoints){
    treasureHuntData.shift();
  }

  treasureHuntData.forEach(point => {
    point.miningDistance = parseFloat(point.miningDistance.toFixed(2));
    point.treasureDistance = parseFloat(point.treasureDistance.toFixed(2));
  });
}

world.afterEvents.playerBreakBlock.subscribe((event) => {
  if (!TREASURE_HUNT_IN_PROGRESS) return;
  const currentBlockPos = event.block.location;
  if(!firstBlockPos2){
    firstBlockPos2 = currentBlockPos;
  }

  const miningDistance = calculateDistanceFromStart(currentBlockPos);
  const treasureDistance = calculateDistanceFromTreasure(currentBlockPos);

  treasureHuntData.push({ miningDistance, treasureDistance });
  updateTreasureHuntDataPoints();

});

export function getTreasureHuntScatterData(){
  return treasureHuntData;
}



// Function to clear Treasure Hunt data when the game ends
export function clearTreasureHuntData() {
  treasureHuntData.length = 0;
  firstBlockPos2 = null;
}

export { dataPoints, totalBlocksMined};