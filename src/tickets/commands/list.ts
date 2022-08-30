import { ApplicationCommandOptionType, User, Role, CommandInteraction, EmbedBuilder } from "discord.js";
import { Discord, SlashGroup, Slash, SlashOption } from "discordx";
import { IsNull, Not } from "typeorm";
import { AppDataSource } from "../../database/data-source.js";
import { TicketsEntity } from "../../database/entity/tickets.js";
import { PermissionSet } from "../../enums/permissions.js";

@Discord()
@SlashGroup({
    name: "list",
    description: "list options",
    root: "ticket"
  })
export class ListTicketCommand {

    /**
    * list all unclaimed tickets with an option to filter roles of users
    * @param interaction the interaction with the ticket command
    */
    @Slash("unclaimed", {defaultMemberPermissions: PermissionSet.STAFF_CHAT_ACCESS.toArrayList()})
    @SlashGroup("list", "ticket")
    // command options
    async listUnclaimed(
       @SlashOption("user", { description: "Filter by user", required: false, type: ApplicationCommandOptionType.User }) userFilter: User,
       @SlashOption("rolefilter", { description: "Filter by role", required: false, type: ApplicationCommandOptionType.Role }) roleFilter: Role,
       interaction: CommandInteraction
    )
    // command execution
    {

        // get channel data
        const ticketCollection = await AppDataSource.getRepository(TicketsEntity).find({
            select: {
                channel: true,
                user: true,
                handler: true
            },
            where: {
                handler: IsNull()
            }
        });

        let channelList: string = "";
        let filterText = roleFilter != undefined ? `Filtered by role: <@&${roleFilter.id}>` : `No role filter...`
        filterText = filterText.concat(userFilter != undefined ? `\nFiltered by user: <@${userFilter.id}>` : `\nNo user filter...`)

        // limit for 10 loops
        if (ticketCollection.length > 0) {
            for (let i = 0, e = 0; i <= 9 && e < ticketCollection.length; e++) {
                if (roleFilter != undefined) {
                    const member = await interaction.guild?.members.fetch(ticketCollection[e].user);
                    if (!member?.roles.cache.has(roleFilter.id)) continue;
                }

                if (userFilter != undefined) {
                    if (ticketCollection[e].user != userFilter.id) continue;
                }

                channelList = channelList.concat(`\n- <#${ticketCollection[e].channel}> | <@${ticketCollection[e].user}>`)
                i++;
            }
        }
        
        if (channelList === "") channelList = "\n- none";
        

        const embed = new EmbedBuilder()
            .setColor("#7c6ea7")
            .setTitle("Unclaimed Tickets")
            .setDescription(`${filterText}\n${channelList}`)

        interaction.reply({embeds: [embed]})
        
    }

    /**
    * list all claimed tickets with an option to filter roles of users
    * @param interaction the interaction with the ticket command
    */
    @Slash("claimed", {defaultMemberPermissions: PermissionSet.STAFF_CHAT_ACCESS.toArrayList()})
    @SlashGroup("list", "ticket")
    // command options
     async listClaimed(
       @SlashOption("user", { description: "Filter by user", required: false, type: ApplicationCommandOptionType.User }) userFilter: User,
       @SlashOption("rolefilter", { description: "Filter by role", required: false, type: ApplicationCommandOptionType.Role }) roleFilter: Role,
       interaction: CommandInteraction
    )
    // command execution
    {
        // get channel data
        const ticketCollection = await AppDataSource.getRepository(TicketsEntity).find({
            select: {
                channel: true,
                user: true,
                handler: true
            },
            where: {
                handler: Not(IsNull())
            }
        });
        
        let channelList: string = "";
        let filterText = roleFilter != undefined ? `Filtered by role: <@&${roleFilter.id}>` : `No role filter...`
        filterText = filterText.concat(userFilter != undefined ? `\nFiltered by user: <@${userFilter.id}>` : `\nNo user filter...`)


        // limit for 10 loops
        if (ticketCollection.length > 0) {
            for (let i = 0, e = 0; i <= 9 && e < ticketCollection.length; e++) {
                if (roleFilter != undefined) {
                    const member = await interaction.guild?.members.fetch(ticketCollection[e].user);
                    if (!member?.roles.cache.has(roleFilter.id)) continue;
                }

                if (userFilter != undefined) {
                    if (ticketCollection[e].user != userFilter.id) continue;
                }

                channelList = channelList.concat(`\n- <#${ticketCollection[e].channel}> | <@${ticketCollection[e].user}>`)
                i++;
            }
        }
        
        if (channelList === "") channelList = "\n- none";
        

        const embed = new EmbedBuilder()
            .setColor("#7c6ea7")
            .setTitle("Claimed Tickets")
            .setDescription(`${filterText}\n${channelList}`)

        interaction.reply({embeds: [embed]})
        
    }

    /**
    * list all tickets with an option to filter by users
    * @param interaction the interaction with the ticket command
    */
    @Slash("all", {defaultMemberPermissions: PermissionSet.STAFF_CHAT_ACCESS.toArrayList()})
    @SlashGroup("list", "ticket")
    // command options
     async list(
       @SlashOption("user", { description: "Filter by user", required: false, type: ApplicationCommandOptionType.User }) userFilter: User,
       @SlashOption("rolefilter", { description: "Filter by role", required: false, type: ApplicationCommandOptionType.Role }) roleFilter: Role,
       interaction: CommandInteraction
    )
    // command execution
    {
          // get channel data
        const ticketCollection = await AppDataSource.getRepository(TicketsEntity).find({
            select: {
                channel: true,
                user: true,
                handler: true
            }
        });
        
        let channelList: string = "";
        let filterText = roleFilter != undefined ? `Filtered by role: <@&${roleFilter.id}>` : `No role filter...`
        filterText = filterText.concat(userFilter != undefined ? `\nFiltered by user: <@${userFilter.id}>` : `\nNo user filter...`)

        // limit for 10 loops
        if (ticketCollection.length > 0) {
            for (let i = 0, e = 0; i <= 9 && e < ticketCollection.length; e++) {
                if (roleFilter != undefined) {
                    const member = await interaction.guild?.members.fetch(ticketCollection[e].user);
                    if (!member?.roles.cache.has(roleFilter.id)) continue;
                }

                if (userFilter != undefined) {
                    if (ticketCollection[e].user != userFilter.id) continue;
                }

                channelList = channelList.concat(`\n- <#${ticketCollection[e].channel}> | <@${ticketCollection[e].user}>`)
                i++;
            }
        }
        
        if (channelList === "") channelList = "\n- none";
        

        const embed = new EmbedBuilder()
            .setColor("#7c6ea7")
            .setTitle("Tickets List")
            .setDescription(`${filterText}\n${channelList}`)

        interaction.reply({embeds: [embed]})
        
    }
}