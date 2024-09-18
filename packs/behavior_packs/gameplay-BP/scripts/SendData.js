import { world, system } from "@minecraft/server";

// Function to collect player data
function collectPlayerData(player) {
    return {
        name: player.name,
        id: player.id,
        position: {
            x: Math.floor(player.location.x),
            y: Math.floor(player.location.y),
            z: Math.floor(player.location.z)
        },

        // to be completed with more data
        // logging functions(event-driven) needed
    };
}

// Function to store data in memory
function storeData(data) {
    const existingData = world.getDynamicProperty("collectedData") || "[]";
    const dataArray = JSON.parse(existingData);
    dataArray.push(data);
    world.setDynamicProperty("collectedData", JSON.stringify(dataArray));
}

// Run data collection every 1 minute
system.runInterval(() => {
    for (const player of world.getAllPlayers()) {
        const data = collectPlayerData(player);
        storeData(data);
    }
}, 1200);

// Function to send data (triggered by user command)
function sendData(player) {
    const data = world.getDynamicProperty("collectedData") || "[]";
    const encodedData = encodeURIComponent(data);
    const url = `https://designated-server.com/api/data?player=${encodeURIComponent(player.name)}&data=${encodedData}`;
    player.sendMessage(`§2§l[Click here to send data]§r(${url})`);
    // Clear the stored data after sending
    world.setDynamicProperty("collectedData", "[]");
}

// Listen for the send data command
// Store player data and call the send data function
world.beforeEvents.chatSend.subscribe((eventData) => {
    if (eventData.message === "!senddata") {
        const data = collectPlayerData(eventData.sender);
        storeData(data);
        sendData(eventData.sender);
        eventData.cancel = true;
    }
});