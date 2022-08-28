import { PermissionFlagsBits, PermissionResolvable } from "discord.js";

// This is not a typical enum class, because they are used to retrive objects that are
// neither numeric or string based, it's using a trick to be used like an enum.
// blame typescript.

export class PermissionSet {
    static readonly FULL_CHAT_ACCESS  = new PermissionSet("FULL_CHAT_ACCESS", [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.ReadMessageHistory,
        PermissionFlagsBits.AddReactions,
        PermissionFlagsBits.UseExternalEmojis,
        PermissionFlagsBits.UseExternalStickers,
        PermissionFlagsBits.AttachFiles,
        PermissionFlagsBits.EmbedLinks,
        PermissionFlagsBits.SendMessages
    ])

    static readonly STAFF_CHAT_ACCESS  = new PermissionSet("STAFF_CHAT_ACCESS", [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.ReadMessageHistory,
        PermissionFlagsBits.AddReactions,
        PermissionFlagsBits.UseExternalEmojis,
        PermissionFlagsBits.UseExternalStickers,
        PermissionFlagsBits.AttachFiles,
        PermissionFlagsBits.EmbedLinks,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.UseApplicationCommands,
        PermissionFlagsBits.ModerateMembers,
        PermissionFlagsBits.ManageMessages
    ])
  
    // private to disallow creating other instances of this type
    private constructor(private readonly key: string, public readonly value: PermissionResolvable) {
    }
  
    toString() {
        return this.key;
    }
    
    // get the value as in the button
    toArrayList() {
        return this.value;
    }
}