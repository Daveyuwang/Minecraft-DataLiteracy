import { world, system } from "@minecraft/server";

export let elapsedMilliseconds = 0;
export let elapsedSeconds = 0;
export let timerActive = true;
let timerInterval = null;
let isTimerDisplay = true;

function startTimer() {
  if (!timerInterval) {
    let lastDisplayUpdate = 0;
    timerInterval = system.runInterval(() => {
      if (timerActive) {
        elapsedMilliseconds += 50;
        const newElapsedSeconds = Math.floor(elapsedMilliseconds / 1000);
        
        if (newElapsedSeconds !== elapsedSeconds) {
          elapsedSeconds = newElapsedSeconds;
          if (isTimerDisplay && elapsedSeconds !== lastDisplayUpdate) {
            updateTimerDisplay();
            lastDisplayUpdate = elapsedSeconds;
          }
        }
      }
    }, 1);
  }
}

export async function disableTimerDisplay(){
  isTimerDisplay = false;
  system.runTimeout(() => {
    isTimerDisplay = true;
  }, 100);
}

function stopTimer() {
  if (timerInterval) {
    system.clearRun(timerInterval);
    timerInterval = null;
  }
}

export function resetTimer() {
  elapsedMilliseconds = 0;
  elapsedSeconds = 0;
  updateTimerDisplay();
}

function updateTimerDisplay() {
  const minutes = Math.floor(elapsedSeconds / 60);
  const seconds = elapsedSeconds % 60;
  
  const formattedTime = `${minutes}:${seconds.toString().padStart(2, '0')}`;
  const displayText = `§l§b${formattedTime}§r§r`;
  
  const playerList = world.getPlayers();
  for (const player of playerList) {
    player.runCommandAsync(`title @s actionbar ${displayText}`);
  }
}

export function toggleTimer() {
  timerActive = !timerActive;
  if (timerActive) {
    startTimer();
    const showMessage = "§l§bTimer started!§r§r";
    world.sendMessage(showMessage);
  } else {
    stopTimer();
    const showMessage = "§l§cTimer paused!§r§r";
    world.sendMessage(showMessage);
  }
}

world.afterEvents.worldInitialize.subscribe(() => {
  startTimer();
});

world.afterEvents.chatSend.subscribe((eventData) => {
  if (eventData.message === "reset timer") {
    resetTimer();
    const showMessage = "§l§bTimer reset!§r§r";
    world.sendMessage(showMessage);
  }
});

world.afterEvents.itemUse.subscribe((eventData) => {
  if (eventData.itemStack.typeId === "minecraft:clock") {
    toggleTimer();
  }
});
