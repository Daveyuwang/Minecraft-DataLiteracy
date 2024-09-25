# Minecraft Data Literacy
## Overview

This project aims to improve data literacy through a fun and interactive experience in *Minecraft Bedrock Edition*. Players engage in educational activities, such as NPC dialogues and data visualizations, to learn key data concepts. 

### Features

- **NPC Dialogues**: Interact with NPCs to gain information and guidance.
- **Data Visualizations**: Use various graphs, including bar graphs, line graphs, and scatterplots.
   These visualizations are designed to be dynamic and adaptable based on gameplay data:
  - **Bar Graphs**:
    - Top 8 block types at a specific level
    - Block diversity across different levels
    - Block quantity distribution across levels
  
  - **Line Graphs**:
    - Block changes over time.
    - Block changes for specific block types over time
    - Player distance progression over time
    - Distance from the treasure block over time (mini-game specific)
  
  - **Scatterplots**:
    - Mining distance vs. average block break time
    - Mining distance vs. treasure distance (mini-game specific)
- **Mini-Games**: Learn data science through gamified experiences. Currently, the **Treasure Hunt** mini-game is available.

## Requirements

- Latest version of *Minecraft Bedrock Edition*
- Operating System: Windows 10/11 (Recommended)

## **Components**

All Packs are developed using *Minecraft Bedrock Scripting API*. The API version must be the latest in order to function normally in the latest release of *Minecraft Bedrock*.

1. **Gameplay Behavior Pack**: Implements core gameplay mechanics and data visualizations.

2. **NPC Dialogue Behavior Pack**: Manages NPC interactions and dialogue systems.

3. **Gameplay Resource Pack**: Provides visual assets for the gameplay features.

4. **World Template (`dtworld`)**: A pre-configured world that works well with the provided packs.

## Installation

### Direct Installation

1. Run `\packaged\mc_dataliteracy.mcaddon` to import the required packs.
2. Run `\packaged\mc_dataliteracy.mcworld` to import the world template.

The detailed contents can be extracted from the above two files if needed.

### Manual Installation

#### For Windows Users
Game file location:

`%localappdata%\Packages\Microsoft.MinecraftUWP_8wekyb3d8bbwe\LocalState\games\com.mojang`

1. Place behavior packs in `\behavior_packs`
2. Place resource packs in `\resource_packs`
3. Place world template folder `dtworld` in `\minecraftWorlds`
4. In-game setup:
   - Navigate to the world
   - Enable packs in world settings:
     - **Data-Literacy-NPC-Dialogue**
     - **Data-Literacy-Gameplay**

#### For Developers
To work on and test the project:

1. Clone this repository:
    ```bash
    git clone https://github.com/Daveyuwang/Minecraft-DataLiteracy.git
    ```
2. Place all packs in the `development_packs` folder under the game directory `com.mojang`.
3. The `packs/` directory contains the source files for behavior and resource packs.

## **Session & Data Collection**

A **'Session'** refers to the educational mini-game component in this project. During the session, the player engages in the mini-game, and their behavior is logged for analysis.

### **Purpose**

The goal of data collection (logging) is to **demonstrate and analyze the impact of gamification and interactive designs on the user's learning process and outcomes**.

### **Session Management**

Sessions can be ended in the following ways:

1. The session is stopped automatically when the player achieves the goal in the mini-game.
2. **Idle Detection**: A player is considered idle under the following conditions:
   - **No movement for 5 minutes**
   - **No camera rotation for 3 minutes**

If the player is idle, the session is **forcibly stopped** and **will not resume**.

> **Note:**
> - The **total session time** and the player's **engagement time** are recorded.
> - After the session ends, the player can still interact with the game, but **no further data will be collected**.

### **Data Storage & Transmission**

Due to the limitations of the *Minecraft Bedrock Scripting API* in accessing the local file system:

- Collected data is stored in-game using `dynamic properties`.
- Data is transmitted by **encoding the data into a URI**.
- The script generates a **URL** and sends it to the user in-game.
- The user sends the data by **clicking the URL**, which transmits it to the designated server.

## **Data to Collect**

1. **Engagement Metrics**
   - **Engagement Time**: Compare the player's active engagement time to the total session time.

2. **Visualization Usage**
   - Types of visualizations accessed, including their frequency and time spent viewing each.
   - The order in which visualizations are accessed.

3. **Performance Metrics**
   - Time taken to find the treasure.
   - Total blocks mined and blocks mined at the correct level.

4. **Player Behavior Post-Visualization / Post-Guidance**
   - Log decision points and actions after viewing visualizations or receiving guidance.
   - Track changes in mining direction, level, and proximity to the treasure after visualizations.
   - For block distribution visualizations, log if the player mines on the correct level.
   - For line graphs showing distance over time, log correct decisions if the player's actions follow the trend (e.g., continuing in the same direction if distance is decreasing).
   - For scatter plots of mining distance vs. treasure distance, log correct decisions if the player focuses on areas indicated by the plot.
   
   > **Note:**
   > A **correct decision** is defined as any action that brings the player closer to the treasure. This is measured by comparing the player's distance from the treasure block before and after the decision is made.

5. **Checkpoint Data**
   - Time elapsed and blocks mined (both total and on the correct level) at checkpoints.
   - Visualization usage summary, including the number of visualizations accessed and most frequently viewed.
   - Record "correct decisions" and actions taken since the last checkpoint, including any additional guidance or tips viewed.


