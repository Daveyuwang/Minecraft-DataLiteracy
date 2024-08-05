import { world } from "@minecraft/server";
import { TREASURE_BLOCK_POSITION } from "./TreasureHunt.js";

const MAX_DATA_POINTS = 10;
let distanceData = [];
let startTime = 0;
let timerActive = false;

function calculateDistance(pos1, pos2) {
  const dx = pos1.x - pos2.x;
  const dy = pos1.y - pos2.y;
  const dz = pos1.z - pos2.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

export function updateDistanceData(blockPosition) {
  if (!TREASURE_BLOCK_POSITION || !timerActive) return;

  const currentTime = (Date.now() - startTime) / 1000; 
  const distance = calculateDistance(blockPosition, TREASURE_BLOCK_POSITION);
  
  distanceData.push({ time: currentTime, distance: distance });
  
  if (distanceData.length > MAX_DATA_POINTS) {
    distanceData = distanceData.slice(-MAX_DATA_POINTS);
  }
}

export function startDistanceTracking() {
  timerActive = true;
  startTime = Date.now();
  distanceData = [];
}

export function stopDistanceTracking() {
  timerActive = false;
}

export function resetDistanceData() {
  distanceData = [];
  startTime = Date.now();
}

export function getDistanceData() {
  return distanceData;
}

// export function printDistanceData() {
//   world.sendMessage("§e--- Current Distance Data ---");
//   distanceData.forEach((data, index) => {
//     world.sendMessage(`§fPoint ${index + 1}: Time: ${data.time.toFixed(2)}s, Distance: ${data.distance.toFixed(2)}`);
//   });
//   world.sendMessage(`§aTotal data points: ${distanceData.length}`);
//   world.sendMessage("§e-----------------------------");
// }