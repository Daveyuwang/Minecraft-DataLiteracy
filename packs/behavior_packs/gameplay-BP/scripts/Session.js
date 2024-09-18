import { world, system } from "@minecraft/server";
import { elapsedSeconds, timerActive, startTimer, stopTimer } from "./Timer.js";

let sessionStartTime = null;
let lastMoveTime = null;
let lastRotateTime = null;
let isEngaged = false;
let lastRotation = null;
let waitingForMovement = false;
let initialPosition = null;
let sessionEnded = false;
let sessionStarting = false;

let showMovePrompt = false;

const IDLE_CAMERA_THRESHOLD = 180; // 3 minutes
const IDLE_MOVEMENT_THRESHOLD = 300; // 5 minutes

const IDLE_REASON = {
    MOVEMENT: "Not moving for 5 minutes",
    CAMERA: "Not changing the camera for 3 minutes"
};

export function startSession() {
    const player = world.getAllPlayers()[0];
    if (player.hasTag("tutored") && sessionStartTime === null && !sessionEnded) {
        startTimer();
        sessionStartTime = elapsedSeconds;
        lastMoveTime = elapsedSeconds;
        lastRotateTime = elapsedSeconds;
        lastRotation = player.getRotation();
        isEngaged = true;
        world.sendMessage("§o[BROADCAST]§r §l§aSession started§r");
        console.warn("Session started");
    }
}

function checkIdleStatus(currentTime) {
    const idleMovementTime = currentTime - lastMoveTime;
    const idleCameraTime = currentTime - lastRotateTime;

    if (idleMovementTime > IDLE_MOVEMENT_THRESHOLD) {
        endSession('idle', IDLE_REASON.MOVEMENT);
    } else if (idleCameraTime > IDLE_CAMERA_THRESHOLD) {
        endSession('idle', IDLE_REASON.CAMERA);
    }
}

let sessionInitialized = false;

function checkPlayerActivity() {
    const player = world.getAllPlayers()[0];
    if (!player || !player.hasTag("tutored") || sessionEnded) return;

    const currentRotation = player.getRotation();
    const velocity = player.getVelocity();

    if (waitingForMovement) {
        if (hasPlayerMoved(initialPosition, player.location)) {
            waitingForMovement = false;
            showMovePrompt = false;
            startSession();
        }
        return;
    }

    if (sessionStartTime === null || !isEngaged) return;

    if (timerActive && isEngaged) {
        const currentTime = elapsedSeconds;

        // Check for movement
        if (velocity.x !== 0 || velocity.y !== 0 || velocity.z !== 0) {
            lastMoveTime = currentTime;
            lastRotateTime = currentTime; // Reset rotation time when moving
        } else {
            // Check for rotation only if not moving
            if (lastRotation && (
                currentRotation.x !== lastRotation.x ||
                currentRotation.y !== lastRotation.y
            )) {
                lastRotateTime = currentTime;
            }
        }

        lastRotation = currentRotation;

        checkIdleStatus(currentTime);
    }
}

function checkForMovement(player) {
    if (!waitingForMovement) return;

    const currentPosition = player.location;
    if (hasPlayerMoved(initialPosition, currentPosition)) {
        waitingForMovement = false;
        showMovePrompt = false;
        sessionInitialized = true;  // Set this flag when movement is detected
        startSession(); // This will now start the timer and session
        player.removeTag("firstjoin"); // Remove firstjoin tag after starting the session
    } else {
        // If player hasn't moved, check again after a short delay
        system.runTimeout(() => {
            checkForMovement(player);
        }, 10); // Check every 0.5 seconds
    }
}

world.afterEvents.playerSpawn.subscribe((event) => {
    const player = event.player;
    if (player.hasTag("tutored")) {
        waitForMovementAndStartSession(player);
    } else {
        system.runTimeout(() => {
            world.sendMessage("§e§o[BROADCAST]§r §eIf you want to skip the tutorial, you can press the button on the right wall, or type \"skip\" in chat.§r");
        }, 60);
    }
});

system.runInterval(() => {
    checkPlayerActivity();
}, 20); // Check every second (20 ticks)

function formatTime(seconds) {
    if (seconds < 60) {
        return `§b${seconds} sec§r`;
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `§b${minutes} min ${remainingSeconds} sec§r`;
}

function endSession(reason, idleReason = '') {
    if (sessionStartTime !== null) {
        const totalSessionTime = elapsedSeconds - sessionStartTime;
        let engagementTime = totalSessionTime;

        if (reason === 'idle') {
            const idleTime = Math.min(
                elapsedSeconds - lastMoveTime,
                elapsedSeconds - lastRotateTime
            );
            engagementTime = Math.max(totalSessionTime - idleTime + 1, 0); // Ensure non-negative
        }

        stopTimer();
        world.sendMessage("§o[BROADCAST]§r §l§cSession ended§r");
        world.sendMessage(`§o[BROADCAST]§r §eReason:§r §c${idleReason || reason}§r`);
        world.sendMessage(`§o[BROADCAST]§r Total session time: ${formatTime(totalSessionTime)}`);
        world.sendMessage(`§o[BROADCAST]§r Engagement time: ${formatTime(engagementTime)}`);
        console.warn(`Session ended. Reason: ${idleReason || reason}. Total time: ${totalSessionTime}s, Engagement time: ${engagementTime}s`);
        
        // Reset session variables
        sessionStartTime = null;
        isEngaged = false;
        lastRotation = null;
        lastMoveTime = null;
        lastRotateTime = null;
        sessionEnded = true;
        waitingForMovement = false;
    }
}

world.afterEvents.playerLeave.subscribe(() => {
    if (isEngaged) {
        endSession('leave');
    }
});

// Export functions and variables that might be needed in other files
export { isEngaged, sessionStartTime, endSession };

world.afterEvents.worldInitialize.subscribe(() => {
    // Set up a system to check for players every second
    const checkForPlayersInterval = 20; // 20 ticks is roughly 1 second
    let runId = null;

    const checkForPlayers = () => {
        const players = world.getAllPlayers();
        if (players.length > 0) {
            // Player found, clear the run and proceed with the game logic
            if (runId !== null) {
                system.clearRun(runId);
            }
            handlePlayerJoin(players[0]);
        }
    };

    // Start the interval
    runId = system.runInterval(checkForPlayers, checkForPlayersInterval);
});

function handlePlayerJoin(player) {
    if (!player.hasTag("tutored")) {
        player.teleport(TUTORIAL_SPAWN_LOCATION);
        player.setRotation(TUTORIAL_SPAWN_ROTATION);
        showTutorialWelcome(player);
    } else {
        player.teleport(NORMAL_SPAWN_LOCATION);
        player.setRotation(NORMAL_SPAWN_ROTATION);
        showGameWelcome(player);
        waitForMovementAndStartSession(player);
    }
}

function waitForMovementAndStartSession(player) {
    waitingForMovement = true;
    initialPosition = player.location;
    showMovePrompt = true;
    showMoveToStartPrompt(player);
}

function showMoveToStartPrompt(player) {
    if (showMovePrompt) {
        player.onScreenDisplay.setActionBar("§c§lMove to start§r");
        system.runTimeout(() => {
            showMoveToStartPrompt(player);
        }, 20);
    }
}


function hasPlayerMoved(initialPos, currentPos) {
    const threshold = 0.01; // Small threshold to account for potential floating-point imprecision
    return Math.abs(initialPos.x - currentPos.x) > threshold ||
           Math.abs(initialPos.y - currentPos.y) > threshold ||
           Math.abs(initialPos.z - currentPos.z) > threshold;
}

let TUTORIAL_SPAWN_LOCATION = { x: -377, y: -27, z: 171 };
let TUTORIAL_SPAWN_ROTATION = { x: 0, y: 90 };
let NORMAL_SPAWN_LOCATION = { x: -22, y: -27, z: 79 };
let NORMAL_SPAWN_ROTATION = { x: 0, y:-90 };
const SKIP_TUTORIAL_BUTTON_POSITION = { x: -380, y: -26, z: 174 };
const TELEPORT_PLATE_POSITION = { x: -378, y: -24, z: 221 };

function showTutorialWelcome(player) {
    const subtitleCommand = `titleraw @a[name="${player.name}"] subtitle {"rawtext":[{"text":"You are now in the "},{"text":"§c§lTutorial"},{"text":"§r."}]}`;
    const titleCommand = `titleraw @a[name="${player.name}"] title {"rawtext":[{"text":"The "},{"text":"§a§lWorld of Mining"}]}`;
    player.runCommandAsync(subtitleCommand);
    player.runCommandAsync(titleCommand);
}

function showGameWelcome(player) {
    const subtitleCommand = `titleraw @a[name="${player.name}"] subtitle {"rawtext":[{"text":"Mountain Mining Site"}]}`;
    const titleCommand = `titleraw @a[name="${player.name}"] title {"rawtext":[{"text":"§c§lMINING"},{"text":"§e§l ADVENTURE"}]}`;
    player.runCommandAsync(subtitleCommand);
    player.runCommandAsync(titleCommand);
}

world.afterEvents.buttonPush.subscribe((event) => {
    const player = event.source;
    const buttonPosition = event.block.location;
    
    if ( 
        buttonPosition.x === SKIP_TUTORIAL_BUTTON_POSITION.x &&
        buttonPosition.y === SKIP_TUTORIAL_BUTTON_POSITION.y &&
        buttonPosition.z === SKIP_TUTORIAL_BUTTON_POSITION.z &&
        !player.hasTag("tutored")) {
        world.sendMessage("tutorial skipped");
        player.addTag("tutored");
        // player.addTag("firstjoin"); // Add firstjoin tag when skipping tutorial
        player.teleport(NORMAL_SPAWN_LOCATION);
    player.setRotation(NORMAL_SPAWN_ROTATION);
        showGameWelcome(player);
        waitForMovementAndStartSession(player);
    }
});

world.afterEvents.pressurePlatePush.subscribe((event) => {
    const player = event.source;
    const platePosition = event.block.location;
    
    if ( 
        platePosition.x === TELEPORT_PLATE_POSITION.x &&
        platePosition.y === TELEPORT_PLATE_POSITION.y &&
        platePosition.z === TELEPORT_PLATE_POSITION.z) {
        finishTutorial(player);
    }
});

function finishTutorial(player) {
    player.addTag("tutored");
    player.addTag("firstjoin");
    player.teleport(NORMAL_SPAWN_LOCATION);
    player.setRotation(NORMAL_SPAWN_ROTATION);
    showGameWelcome(player);
    waitForMovementAndStartSession(player);
}

world.afterEvents.chatSend.subscribe((eventData) => {
    const player = eventData.sender;
    if (eventData.message === "remove tutorial tag") {
        player.removeTag("tutored");
        world.sendMessage("§o[BROADCAST]§r §lTutorial tag removed.§r");
    } else if (eventData.message === "remove firstjoin tag") {
        player.removeTag("firstjoin");
        world.sendMessage("§o[BROADCAST]§r §lFirstjoin tag removed.§r");
    } else if (eventData.message === "reset session") {
        endSession('manual');
        sessionEnded = false; // Allow the session to be started again
        world.sendMessage("§o[BROADCAST]§r §lSession reset.§r");
    } else if (eventData.message === "skip" && !player.hasTag("tutored")) {
        finishTutorial(player);
    }
});
