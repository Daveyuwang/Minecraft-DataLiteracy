import { world } from "@minecraft/server";

export class PlayerDistanceTracker {
  constructor(areaCenter, bufferSize) {
    this.areaCenter = areaCenter;
    this.bufferSize = bufferSize;
    this.distanceBuffer = Array(bufferSize).fill(0);
    this.index = 0;
  }

  addDistance(playerPosition) {
    const distance = this.calculateDistance(playerPosition);
    this.distanceBuffer[this.index] = distance;
    this.index = (this.index + 1) % this.bufferSize;
  }

  calculateDistance(position) {
    const { x: x1, y: y1, z: z1 } = this.areaCenter;
    const { x: x2, y: y2, z: z2 } = position;
    return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2 + (z2 - z1) ** 2);
  }

  getStatistics() {
    const distances = this.distanceBuffer.filter((distance) => distance !== 0);
    if (distances.length === 0) {
      return { average: 0, median: 0, max: 0 };
    }

    const sum = distances.reduce((acc, distance) => acc + distance, 0);
    const average = Math.round(sum / distances.length);
    const sorted = distances.sort((a, b) => a - b);
    const median = Math.round(sorted[Math.floor(sorted.length / 2)]);
    const max = Math.round(sorted[sorted.length - 1]);

    return { average, median, max };
  }
}