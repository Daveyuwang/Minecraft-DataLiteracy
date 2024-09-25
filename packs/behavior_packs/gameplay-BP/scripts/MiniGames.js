import { world, system } from "@minecraft/server";
import { ActionFormData } from "@minecraft/server-ui";
import { startTreasureHunt } from "./TreasureHunt";


const DIMENSION = "overworld";
export const STARTER_ENTITY_ID = "mg:starter";


// INTERACT WITH THE STARTER TO OPEN THE FORM

world.beforeEvents.playerInteractWithEntity.subscribe((event) => {
  if (event.target.typeId === STARTER_ENTITY_ID) {
    system.runTimeout(() => {
      starterForm();
    }, 1);
  }
});


// THE STARTER FORM
function starterForm(){
    const form = new ActionFormData();
    form.title("MINI GAMES");
    form.body("Choose a mini game to play");
    form.button("Treasure Hunt","textures/blocks/honeycomb");

    // MORE BUTTONS CAN BE ADDED HERE

    form.show(world.getAllPlayers()[0]).then((response) => {
        if(response.canceled) return;

        switch(response.selection){
            case 0:
              // START TREASURE HUNT
              startTreasureHunt();
              break;

            default:
          }
    });
}

