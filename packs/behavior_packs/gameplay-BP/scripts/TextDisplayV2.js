// TextDisplayV2.js

import {world} from "@minecraft/server";

class TextDisplayV2 {
    constructor(text, position){
        this.text = text;
        this.position = position;
        this.entityId = null;
    }

    spawn(){
        const dimension = world.getDimension("overworld");
        const entity = dimension.spawnEntity("ft:floating_text2", this.position);
        entity.nameTag = this.text;
        this.entityId = entity.id;
    }

    despawn(){
        if(this.entityId){
            const dimension = world.getDimension("overworld");
            const entity = dimension.getEntities().find(entity => entity.id === this.entityId);
            if(entity){
                entity.kill();
                this.entityId = null;
            }
        }
    }

    setText(text){
        this.text = text;
        if(this.entityId){
            const entity = world.getEntity(this.entityId);
            if(entity){
                entity.nameTag = text;
            }
        }
    }

    setPosition(position){
        this.position = position;
        if(this.entityId){
            const entity = world.getEntity(this.entityId);
            if(entity){
                entity.teleport(position, 0, 0);
            }
        }
    }

    static deleteAll(){
        const dimension = world.getDimension("overworld");
        dimension.runCommandAsync("kill @e[type=ft:floating_text2]");
    }

    static deleteAt(position) {
        const dimension = world.getDimension("overworld");
        const entities = dimension.getEntitiesAtBlockLocation(position);
        for (const entity of entities) {
          if (entity.typeId === "ft:floating_text2") {
            entity.kill();
            break;
          }
        }
      }
    
      static setTextAt(text, position) {
        const dimension = world.getDimension("overworld");
        const entities = dimension.getEntitiesAtBlockLocation(position);
        for (const entity of entities) {
          if (entity.typeId === "ft:floating_text2") {
            entity.nameTag = text;
            break;
          }
        }
      }
    }


export {TextDisplayV2};