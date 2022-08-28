import { CommandInteraction, EmbedBuilder, ActionRowBuilder, MessageActionRowComponentBuilder, ApplicationCommandOptionType, User, GuildChannelManager } from "discord.js";
import { Discord, SlashGroup, Slash, SlashOption } from "discordx";
import { AppDataSource } from "../../database/data-source.js";
import { TicketsEntity } from "../../database/entity/tickets.js";
import { TicketButtons } from "../../enums/buttons.js";
import { PermissionSet } from "../../enums/permissions.js";
import { Util } from "../../util.js";
import { ValidateTicketCommand } from "./validate.js";

@Discord()
@SlashGroup({ name: "ticket", description: "Ticket commands" })
export class AccessTicketCommand {

    /**
    * unclaim a ticket
    */
    @Slash("unclaim", {defaultMemberPermissions: PermissionSet.STAFF_CHAT_ACCESS.toArrayList()})
    @SlashGroup("ticket")
    // command options
    async unclaim(
        @SlashOption("force", { description: "Requires admin: force unclaim", required: false }) forced: boolean,
        interaction: CommandInteraction
    )
    // command execution
    {

        const validation = await ValidateTicketCommand(interaction, {
            category: true,
            force: true,
            forceStatus: forced,
            ifLocked: true,
            ifNotClaimed: true,
            notclaimedByYouWithForce: true,
        });

        if (!validation.ok) return;

        const data = validation.data!;

        interaction.channel?.messages.fetch(data.header!).then(message => {
            const editedEmbed = new EmbedBuilder(message.embeds[0].data)
                .setFooter(null)

            const claimEmbed = new EmbedBuilder()
                .setColor("#FFEA7F")
                .setAuthor({ name: `${Util.capFirst(data.type!)} unclaimed`, iconURL: interaction.user.displayAvatarURL() })
                .setDescription(`Your ${data.type} was unclaimed by <@${interaction.user.id}>.\nIf you think this is a mistake or something that should not have happened\nplease tag a manager.`)

            const editedComponenets: ActionRowBuilder<MessageActionRowComponentBuilder> 
            = new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
                TicketButtons.CLAIM.toValue(),
                TicketButtons.LOCK.toValue(), 
                TicketButtons.CLOSE.toValue()
            );
            
            message.edit({embeds: [editedEmbed, message.embeds[1]], components: [editedComponenets]})
            interaction.reply({embeds: [claimEmbed], ephemeral: false})
            
            // update database
            AppDataSource
                .createQueryBuilder()
                .update(TicketsEntity)
                .set({ handler: null })
                .where("channel = :channel", { channel: interaction.channelId })
                .execute()
        });
    }


    /**
    * assign a ticket to another member
    * note that only the user who has claimed the ticket can reassign it
    * @param who who to assign the ticket to
    * @param forced admin option to force assign
    * @param interaction the interaction with the ticket command
    */
    @Slash("assign", {defaultMemberPermissions: PermissionSet.STAFF_CHAT_ACCESS.toArrayList()})
    @SlashGroup("ticket")
    // command options
    async assign(
        @SlashOption("who", { description: "Who should this ticket be assigned to", required: true, type: ApplicationCommandOptionType.User }) who: User,
        @SlashOption("force", { description: "Requires admin: force assign", required: false }) forced: boolean,
        interaction: CommandInteraction
    )
    // command execution
    {

        const validation = await ValidateTicketCommand(interaction, {
            category: true,
            force: true,
            forceStatus: forced,
            ifLocked: true,
            notclaimedByYouWithForce: true,
            assignee: who,
        });

        if (!validation.ok) return;

        const data = validation.data!;
        const assignee = validation.who!;

        interaction.channel?.messages.fetch(data.header!).then(message => {
            const editedEmbed = new EmbedBuilder(message.embeds[0].data)
                .setFooter({ 
                    text: `This ${data.type} has been assigned to ${assignee.username} by ${interaction.user.username}`, 
                    iconURL: assignee.displayAvatarURL() 
                })

            const claimEmbed = new EmbedBuilder()
                .setColor("#FFEA7F")
                .setAuthor({ name: `${Util.capFirst(data.type!)} was assigned`, iconURL: assignee.displayAvatarURL() })
                .setDescription(`Your ${data.type} will now be handled by <@${assignee.id}>`)
                .setFooter({
                    text: `Assigned by ${interaction.user.username}`,
                    iconURL: interaction.user.displayAvatarURL()
                })

            const dmEmbed = new EmbedBuilder()
                .setColor("#B580BD")
                .setTitle(`You were assigned a ${data.type}`)
                .setDescription("*If you believe this is a mistake, please contact the assigner or a manager*")
                .addFields(
                    {
                        name: "Ticket",
                        value: `<#${interaction.channelId}>`,
                        inline: true
                    },
                    {
                        name: "Assigned By",
                        value: `<@${interaction.user.id}>`,
                        inline: true
                    },
                    {
                        name: "Created By",
                        value: `<@${data.user}>`,
                        inline: true
                    }
                )
                .setTimestamp(Date.now())

            const editedComponenets: ActionRowBuilder<MessageActionRowComponentBuilder> 
            = new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
                TicketButtons.LOCK.toValue(), 
                TicketButtons.CLOSE.toValue()
            );
            
            message.edit({embeds: [editedEmbed, message.embeds[1]], components: [editedComponenets]})
            interaction.reply({embeds: [claimEmbed], ephemeral: false})
            assignee.createDM().then(channel => {
                channel.send({embeds: [dmEmbed]})
            })
            
            // update database
            AppDataSource
                .createQueryBuilder()
                .update(TicketsEntity)
                .set({ handler: assignee.id })
                .where("channel = :channel", { channel: interaction.channelId })
                .execute()
        });

    }

    /**
    * add a member to a ticket
    * @param who who to add
    * @param interaction the interaction with the ticket command
    */
    @Slash("add", {defaultMemberPermissions: PermissionSet.STAFF_CHAT_ACCESS.toArrayList()})
    @SlashGroup("ticket")
    // command options
    async add(
        @SlashOption("who", { description: "Who to add to the ticket", required: true, type: ApplicationCommandOptionType.User }) who: User,
        interaction: CommandInteraction
    )
    // command execution
    {   

        const validation = await ValidateTicketCommand(interaction, {
            category: true,
            ifLocked: true,
            added: who
        });

        if (!validation.ok) return;

        const data = validation.data!;
        const added = validation.who!;

        const viewers = JSON.parse(data.viewers === undefined ? "[]" : data.viewers as string);
        
        if (viewers.includes(added.id)) {
            interaction.reply({ content: `Member already has access to this channel.\nIf you think that is not true please contact a manager.`, ephemeral: true})
            return;
        }

        this.toggleChannelAccess(interaction.guild?.channels, interaction.channelId, added, true);

        const infoEmbed = new EmbedBuilder()
            .setColor("#B3D998")
            .setAuthor({ name: `User added`, iconURL: added.displayAvatarURL() })
            .setDescription(`<@${added.id}> was added to the ${data.type} channel.\nThey are able to view the ${data.type} and send messages.`)
            .setFooter({
                text: `Added by ${interaction.user.username}`,
                iconURL: interaction.user.displayAvatarURL()
            })

        const dmEmbed = new EmbedBuilder()
            .setColor("#B580BD")
            .setTitle(`You were added to a ${data.type}`)
            .setDescription("*If you believe this is a mistake, please contact the staff member that added you*")
            .setTimestamp(Date.now())
            .addFields(
                { name: "Ticket", value: `<#${interaction.channelId}>`, inline: true },
                { name: "Added By", value: `<@${interaction.user.id}>`, inline: true },
                { name: "Created By", value: `<@${data.user}>`, inline: true }
            )
            
        interaction.reply({embeds: [infoEmbed], ephemeral: false})
        
        added.createDM().then(channel => {
            channel.send({embeds: [dmEmbed]})
        })

        viewers.push(added.id)
            
        // update database
        AppDataSource
            .createQueryBuilder()
            .update(TicketsEntity)
            .set({ viewers: JSON.stringify(viewers) })
            .where("channel = :channel", { channel: interaction.channelId })
            .execute()

    }


    /**
    * remove a member from a ticket
    * @param who who to add
    * @param interaction the interaction with the ticket command
    */
    @Slash("remove", {defaultMemberPermissions: PermissionSet.STAFF_CHAT_ACCESS.toArrayList()})
    @SlashGroup("ticket")
    // command options
    async remove(
        @SlashOption("who", { description: "Who to remove from the ticket", required: true, type: ApplicationCommandOptionType.User }) who: User,
        @SlashOption("reason", { description: "Reason for removal", required: true, type: ApplicationCommandOptionType.String}) reason: string,
        interaction: CommandInteraction
    )
    // command execution
    {

        const validation = await ValidateTicketCommand(interaction, {
            category: true,
            ifLocked: true,
            added: who,
        });

        if (!validation.ok) return;

        const data = validation.data!;
        const added = validation.who!;

        const viewers = JSON.parse(data.viewers === undefined ? "[]" : data.viewers as string);
        
        if (!viewers.includes(added.id)) {
            interaction.reply({ content: `${added.username} already has no access to this channel.`, ephemeral: true})
            return;
        }

        this.toggleChannelAccess(interaction.guild?.channels, interaction.channelId, added, false);

        const infoEmbed = new EmbedBuilder()
            .setColor("#FC897E")
            .setAuthor({ name: `User removed`, iconURL: added.displayAvatarURL() })
            .setDescription(`<@${added.id}> was removed from the ${data.type} channel.\nThey are no longer able to view the ${data.type} or send messages.`)
            .addFields({
                name: "Reason",
                value: reason,
                inline: false
            })
            .setFooter({
                text: `Removed by ${interaction.user.username}`,
                iconURL: interaction.user.displayAvatarURL()
            })

        const dmEmbed = new EmbedBuilder()
            .setColor("#B580BD")
            .setTitle(`You were removed from a ${data.type}`)
            .setDescription("*If you believe this is a mistake, please contact the staff member that removed you*")
            .setTimestamp(Date.now())
            .addFields(
                { name: "Ticket", value: `<#${interaction.channelId}>`, inline: true },
                { name: "Removed By", value: `<@${interaction.user.id}>`, inline: true },
                { name: "Created By", value: `<@${data.user}>`, inline: true },
                { name: "Reason", value: reason, inline: false }
            )
            
        interaction.reply({embeds: [infoEmbed], ephemeral: false})
        
        added.createDM().then(channel => {
            channel.send({embeds: [dmEmbed]})
        })

        const index = viewers.indexOf(added.id);
        if (index !== -1) {
            viewers.splice(index, 1);
        }
            
        // update database
        AppDataSource
            .createQueryBuilder()
            .update(TicketsEntity)
            .set({ viewers: JSON.stringify(viewers) })
            .where("channel = :channel", { channel: interaction.channelId })
            .execute()

    }

    
    /**
     * toggles the channel access premissions of a user
     * @param channels the channel manager to get the channel information from
     * @param channelId the id of the channel the manager should fetch
     * @param user user to change the permissions of
     * @param status the status of permissions, either true or false
     */
    private async toggleChannelAccess(channels: GuildChannelManager | undefined, channelId: string, user: User, status: boolean){
        if (channels === undefined) { console.log("Failed to change channel access options | ticket.ts"); return; }

        const fetchedChannel = await channels.fetch(channelId);
        fetchedChannel?.permissionOverwrites.create(user, { 
            ViewChannel: status, 
            ReadMessageHistory: status, 
            AddReactions: status, 
            UseExternalEmojis: status,
            UseExternalStickers: status,
            AttachFiles: status,
            EmbedLinks: status,
            SendMessages: status
        })
    } 
}