# Minecraft Data Literacy

## Overview

This project aims to improve data literacy through a fun and interactive experience in Minecraft Bedrock Edition. Players engage in educational activities, such as NPC dialogues and data visualizations, to learn key data concepts. 

### Features

- **NPC Dialogues**: Interact with NPCs to gain information and guidance.
- **Data Visualizations**: Use various graphs, including bar graphs, line graphs, and scatterplots.
- **Mini-Games**: Learn data science through gamified experiences. Currently, the **Treasure Hunt** mini-game is available.

## Requirements

- Latest version of Minecraft Bedrock Edition
- Operating System: Windows 10/11 (Recommended)

## Components
1. **Gameplay Behavior Pack**: Implements core gameplay mechanics and data visualizations.
2. **NPC Dialogue Behavior Pack**: Manages NPC interactions and dialogue systems.
3. **Gameplay Resource Pack**: Provides visual assets for the gameplay features.
4. **World Template (`dtworld`)**: A pre-configured world that works seamlessly with the provided packs.


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

## Data Collection
Data collection for this project currently focuses on logging player behavior in the Treasure Hunt mini-game.

### With Dedicated Server
- To be implemented.

### Local Gameplay
- To be implemented.