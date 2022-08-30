import { TextInputBuilder, TextInputStyle, ActionRowBuilder, ModalActionRowComponentBuilder } from "discord.js";

// This is not a typical enum class, because they are used to retrive objects that are
// neither numeric or string based, it's using a trick to be used like an enum.
// blame typescript.

export class SelectOptions {
    static readonly ABOUT_ROLES  = new SelectOptions('ABOUT_ROLES', [
        { label: "Reviewer", value: "reviewer", description: "About the role that is given to reviewers", emoji: "<:diamond_shape:1013899470867537990>" },
        { label: "Booster", value: "booster", description: "About the role that is given to boosters", emoji: "<:diamond_shape:1013899470867537990>" },
        { label: "VIP", value: "vip", description: "About the role that is given to VIPs", emoji: "<:diamond_shape:1013899470867537990>" },
        { label: "MVP", value: "mvp", description: "About the role that is given to MVPs", emoji: "<:diamond_shape:1013899470867537990>" },
    ])
        
  
    // private to disallow creating other instances of this type
    private constructor(private readonly key: string, public readonly value: any) { 
    }
  
    toString() {
        return this.key;
    }
    
    // get the value as in the button
    toArray() {
        return this.value;
    }
}