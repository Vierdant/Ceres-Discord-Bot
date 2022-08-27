import { ActionRowBuilder, ApplicationCommandOptionType, Channel, ChannelType, CommandInteraction, EmbedBuilder, GuildChannelManager, GuildMember, messageLink, PermissionFlagsBits, Role, TextChannel, User } from "discord.js";
import { Discord, Slash, SlashChoice, SlashGroup, SlashOption } from "discordx";
import { IsNull, Not } from "typeorm";
import { AppDataSource } from "../database/data-source.js";
import { TicketsEntity } from "../database/entity/tickets.js";
import { TicketButtons } from "../enums/buttons.js";
import { PermissionSet } from "../enums/permissions.js";
import { Util } from "../util.js";

@Discord()
@SlashGroup({ name: "ticket", description: "Ticket commands" })
@SlashGroup({
    name: "list",
    description: "list options",
    root: "ticket" // need to specify root aka parent
  })
export class ticketCommand {

    /**
    * unclaim a ticket
    * note that only the user who has claimed the ticket can unclaim it
    * @param forced admin option to force unclaim
    * @param interaction the interaction with the ticket command
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
        // if member is not staff, cancel
        if (!Util.isStaff(interaction.member as GuildMember)) {
            interaction.reply({ content: "You are not able to execute that action.", ephemeral: true})
            return;
        }

        // if member is an admin, record it
        const isAdmin = Util.isAdmin(interaction.member as GuildMember);
        
        // if channel isn't in support channel, cancel
        if (!await this.inValidCategory(interaction.guild?.channels, interaction.channelId)) {
            interaction.reply({ content: "This command can only be executed in a ticket/request channel.", ephemeral: true})
            return;
        }

        // if command is being forced by someone that isn't admin, cancel
        if (forced === true && isAdmin === false) {
            interaction.reply({ content: "Forcing unclaim is an admin only action.", ephemeral: true})
            return;
        }

        // get channel data
        const ticketData = await AppDataSource.manager.findOneBy(TicketsEntity, {channel: interaction.channel?.id});
        
        const ticketType = ticketData?.type;
        const ticketStatus = ticketData?.status;
        const header = ticketData?.header;
        const handler = ticketData?.handler;

        if (ticketStatus === "LOCKED") {
            interaction.reply({ content: `This ${ticketType} is locked. Locked ${ticketType}s are not eligable to changes.`, ephemeral: true})
            return;
        }

        // if handler is null then the ticket is not claimed by anyone. So, cancel
        if (handler === null) {
            interaction.reply({ content: `This ${ticketType} is not claimed by anyone. Failed to unclaim an unclaimed ${ticketType}.`, ephemeral: true})
            return;
        }

        // if user doesn't own the ticket and forced is not true. Second check only is possible if user is admin
        if (handler != interaction.user.id && forced != true) {
            interaction.reply({ content: `you can't unclaim a ${ticketType} that isn't claimed by you.`, ephemeral: true})
            return;
        }
        

        interaction.channel?.messages.fetch(header!).then(message => {
            const editedEmbed = new EmbedBuilder(message.embeds[0].data)
                .setFooter(null)

            const claimEmbed = new EmbedBuilder()
                .setColor("#FFEA7F")
                .setAuthor({ name: `${Util.capFirst(ticketType!)} unclaimed`, iconURL: interaction.user.displayAvatarURL() })
                .setDescription(`Your ${ticketType} was unclaimed by <@${interaction.user.id}>.\nIf you think this is a mistake or something that should not have happened\nplease tag a manager.`)

            const editedComponenets: ActionRowBuilder<any> = new ActionRowBuilder().addComponents(
                TicketButtons.CLAIM.toValue(),
                TicketButtons.LOCK.toValue(), 
                TicketButtons.CLOSE.toValue());
            
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
        // if member is not staff, cancel
        if (!Util.isStaff(interaction.member as GuildMember)) {
            interaction.reply({ content: "You are not able to execute that action.", ephemeral: true})
            return;
        }

        // if member is an admin, record it
        const isAdmin = Util.isAdmin(interaction.member as GuildMember);
        
        // if channel isn't in support channel, cancel
        if (!await this.inValidCategory(interaction.guild?.channels, interaction.channelId)) {
            interaction.reply({ content: "This command can only be executed in a ticket/request channel.", ephemeral: true})
            return;
        }

        // if command is being forced by someone that isn't admin, cancel
        if (forced === true && isAdmin === false) {
            interaction.reply({ content: "Forcing assign is an admin only action.", ephemeral: true})
            return;
        }

        // get channel data
        const ticketData = await AppDataSource.manager.findOneBy(TicketsEntity, {channel: interaction.channel?.id});
        
        const ticketType = ticketData?.type;
        const ticketStatus = ticketData?.status;
        const header = ticketData?.header;
        const handler = ticketData?.handler;

        if (ticketStatus === "LOCKED") {
            interaction.reply({ content: `This ${ticketType} is locked. Locked ${ticketType}s are not eligable to changes.`, ephemeral: true})
            return;
        }

        // if user doesn't own the ticket and forced is not true. Second check only is possible if user is admin
        if (handler != interaction.user.id && handler != null && forced != true) {
            interaction.reply({ content: `you can't assign a ${ticketType} to someone else when the ${ticketType} isn't claimed by you.`, ephemeral: true})
            return;
        }

        let assigneeMember = await interaction.guild?.members.fetch(who.id)
        const assignee = assigneeMember === undefined ? who : assigneeMember.user;

        if (!Util.isStaff(assigneeMember as GuildMember)) {
            interaction.reply({ content: `You are not able to assign a ${ticketType} to a someone that is not a staff member`, ephemeral: true})
            return;
        }

        interaction.channel?.messages.fetch(header!).then(message => {
            const editedEmbed = new EmbedBuilder(message.embeds[0].data)
                .setFooter({ 
                    text: `This ${ticketType} has been assigned to ${assignee.username} by ${interaction.user.username}`, 
                    iconURL: assignee.displayAvatarURL() 
                })

            const claimEmbed = new EmbedBuilder()
                .setColor("#FFEA7F")
                .setAuthor({ name: `${Util.capFirst(ticketType!)} was assigned`, iconURL: assignee.displayAvatarURL() })
                .setDescription(`Your ${ticketType} will now be handled by <@${assignee.id}>`)
                .setFooter({
                    text: `Assigned by ${interaction.user.username}`,
                    iconURL: interaction.user.displayAvatarURL()
                })

            const dmEmbed = new EmbedBuilder()
                .setColor("#B580BD")
                .setTitle(`You were assigned a ${ticketType}`)
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
                        value: `<@${ticketData?.user}>`,
                        inline: true
                    }
                )
                .setTimestamp(Date.now())

            const editedComponenets: ActionRowBuilder<any> = new ActionRowBuilder().addComponents(
                TicketButtons.LOCK.toValue(), 
                TicketButtons.CLOSE.toValue());
            
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
        // if member is not staff, cancel
        if (!Util.isStaff(interaction.member as GuildMember)) {
            interaction.reply({ content: "You are not able to execute that action.", ephemeral: true})
            return;
        }
        // if channel isn't in support channel, cancel
        if (!await this.inValidCategory(interaction.guild?.channels, interaction.channelId)) {
            interaction.reply({ content: "This command can only be executed in a ticket/request channel.", ephemeral: true})
            return;
        }

        // get channel data
        const ticketData = await AppDataSource.manager.findOneBy(TicketsEntity, {channel: interaction.channel?.id});
        
        const ticketType = ticketData?.type;
        const ticketStatus = ticketData?.status;

        if (ticketStatus === "LOCKED") {
            interaction.reply({ content: `This ${ticketType} is locked. Locked ${ticketType}s are not eligable to changes.`, ephemeral: true})
            return;
        }


        let addedMember = await interaction.guild?.members.fetch(who.id)
        const added = addedMember === undefined ? who : addedMember.user;

        if (Util.isStaff(addedMember as GuildMember)) {
            interaction.reply({ content: `You don't have to add a staff member... They already have access.`, ephemeral: true})
            return;
        }

        let viewers = JSON.parse(ticketData?.viewers === undefined ? "[]" : ticketData?.viewers as string);
        
        if (viewers.includes(added.id)) {
            interaction.reply({ content: `Member already has access to this channel.\nIf you think that is not true please contact a manager.`, ephemeral: true})
            return;
        }

        this.toggleChannelAccess(interaction.guild?.channels, interaction.channelId, added, true);

        const infoEmbed = new EmbedBuilder()
            .setColor("#B3D998")
            .setAuthor({ name: `User added`, iconURL: added.displayAvatarURL() })
            .setDescription(`<@${added.id}> was added to the ${ticketType} channel.\nThey are able to view the ${ticketType} and send messages.`)
            .setFooter({
                text: `Added by ${interaction.user.username}`,
                iconURL: interaction.user.displayAvatarURL()
            })

        const dmEmbed = new EmbedBuilder()
            .setColor("#B580BD")
            .setTitle(`You were added to a ${ticketType}`)
            .setDescription("*If you believe this is a mistake, please contact the staff member that added you*")
            .setTimestamp(Date.now())
            .addFields(
                { name: "Ticket", value: `<#${interaction.channelId}>`, inline: true },
                { name: "Added By", value: `<@${interaction.user.id}>`, inline: true },
                { name: "Created By", value: `<@${ticketData?.user}>`, inline: true }
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
        // if member is not staff, cancel
        if (!Util.isStaff(interaction.member as GuildMember)) {
            interaction.reply({ content: "You are not able to execute that action.", ephemeral: true})
            return;
        }
        // if channel isn't in support channel, cancel
        if (!await this.inValidCategory(interaction.guild?.channels, interaction.channelId)) {
            interaction.reply({ content: "This command can only be executed in a ticket/request channel.", ephemeral: true})
            return;
        }

        // get channel data
        const ticketData = await AppDataSource.manager.findOneBy(TicketsEntity, {channel: interaction.channel?.id});
        
        const ticketType = ticketData?.type;
        const ticketStatus = ticketData?.status;

        if (ticketStatus === "LOCKED") {
            interaction.reply({ content: `This ${ticketType} is locked. Locked ${ticketType}s are not eligable to changes.`, ephemeral: true})
            return;
        }


        let addedMember = await interaction.guild?.members.fetch(who.id)
        const added = addedMember === undefined ? who : addedMember.user;

        if (Util.isStaff(addedMember as GuildMember)) {
            interaction.reply({ content: `You can't remove a staff member from this ${ticketType}...`, ephemeral: true})
            return;
        }

        let viewers = JSON.parse(ticketData?.viewers === undefined ? "[]" : ticketData?.viewers as string);
        
        if (!viewers.includes(added.id)) {
            interaction.reply({ content: `${added.username} already has no access to this channel.`, ephemeral: true})
            return;
        }

        this.toggleChannelAccess(interaction.guild?.channels, interaction.channelId, added, false);

        const infoEmbed = new EmbedBuilder()
            .setColor("#FC897E")
            .setAuthor({ name: `User removed`, iconURL: added.displayAvatarURL() })
            .setDescription(`<@${added.id}> was removed from the ${ticketType} channel.\nThey are no longer able to view the ${ticketType} or send messages.`)
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
            .setTitle(`You were removed from a ${ticketType}`)
            .setDescription("*If you believe this is a mistake, please contact the staff member that removed you*")
            .setTimestamp(Date.now())
            .addFields(
                { name: "Ticket", value: `<#${interaction.channelId}>`, inline: true },
                { name: "Removed By", value: `<@${interaction.user.id}>`, inline: true },
                { name: "Created By", value: `<@${ticketData?.user}>`, inline: true },
                { name: "Reason", value: reason, inline: false }
            )
            
        interaction.reply({embeds: [infoEmbed], ephemeral: false})
        
        added.createDM().then(channel => {
            channel.send({embeds: [dmEmbed]})
        })

        let index = viewers.indexOf(added.id);
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
    * set a ticket pending status to true only if it's false
    * @param interaction the interaction with the ticket command
    */
    @Slash("pending", {defaultMemberPermissions: PermissionSet.STAFF_CHAT_ACCESS.toArrayList()})
    @SlashGroup("ticket")
    // command options
    async pending(
        @SlashOption("notify", { description: "Notify the user of the ticket", required: true, type: ApplicationCommandOptionType.Boolean }) notify: boolean,
        interaction: CommandInteraction
    )
    // command execution
    {
        // if member is not staff, cancel
        if (!Util.isStaff(interaction.member as GuildMember)) {
            interaction.reply({ content: "You are not able to execute that action.", ephemeral: true})
            return;
        }

        // if channel isn't in support channel, cancel
        if (!await this.inValidCategory(interaction.guild?.channels, interaction.channelId)) {
            interaction.reply({ content: "This command can only be executed in a ticket/request channel.", ephemeral: true})
            return;
        }

        // get channel data
        const ticketData = await AppDataSource.manager.findOneBy(TicketsEntity, {channel: interaction.channel?.id});
        const ticketType = ticketData?.type;
        const ticketHandler = ticketData?.handler;
        const ticketStatus = ticketData?.status;
        const userId = ticketData?.user;
        const user = await interaction.guild?.members.fetch(userId as string)

        if (ticketStatus === "LOCKED") {
            interaction.reply({ content: `This ${ticketType} is locked. Locked ${ticketType}s are not eligable to changes.`, ephemeral: true})
            return;
        }
        
        if (ticketStatus === "PENDING") {
            interaction.reply({ content: `This ${ticketType} is already pending.`, ephemeral: true})
            return;
        }

        if (ticketHandler != interaction.user.id) {
            interaction.reply({ content: `You can't set a ${ticketType} that isn't claimed by you to pending.`, ephemeral: true})
            return;
        }
        
        const pendingEmbed = new EmbedBuilder()
            .setTitle(`This ${ticketType} is now pending.`)
            .setColor("#FFEA7F")
            .setDescription(`The next message sent by a user will\nnotify the staff member handling the ${ticketType}.`)
            .setTimestamp(Date.now())
            .setFooter({text: `Set by: ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL()})

        const dmEmbed = new EmbedBuilder()
            .setTitle(`Your ${ticketType} is now pending.`)
            .setColor("#FFEA7F")
            .setDescription(`A ${ticketType} created by you has been set to pending and is now awaiting your response.\nWhen you respond to the ${ticketType}, it will notify the person handling your ${ticketType}.\n\nNote that if there are other users added to the ${ticketType}, a reposne from them\nwill notify the handler as well.`)
            .setTimestamp(Date.now())
            .setFooter({text: `Pending request by: ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL()})
    
        interaction.reply({embeds: [pendingEmbed], fetchReply: true}).then(() => {
            if (notify) {
                user?.createDM().then(channel => {
                    channel.send({embeds: [dmEmbed]})
                })
            }
        })

        // update database
        AppDataSource
            .createQueryBuilder()
            .update(TicketsEntity)
            .set({ status: "PENDING" })
            .where("channel = :channel", { channel: interaction.channelId })
            .execute()
    }

    /**
    * go to header message to access ticket controls
    * @param interaction the interaction with the ticket command
    */
    @Slash("control", {defaultMemberPermissions: PermissionSet.STAFF_CHAT_ACCESS.toArrayList()})
    @SlashGroup("ticket")
    // command options
    async control(
        interaction: CommandInteraction
    )
    // command execution
    {
        // if member is not staff, cancel
        if (!Util.isStaff(interaction.member as GuildMember)) {
            interaction.reply({ content: "You are not able to execute that action.", ephemeral: true})
            return;
        }

        // if channel isn't in support channel, cancel
        if (!await this.inValidCategory(interaction.guild?.channels, interaction.channelId)) {
            interaction.reply({ content: "This command can only be executed in a ticket/request channel.", ephemeral: true})
            return;
        }

        // get channel data
        const ticketData = await AppDataSource.manager.findOneBy(TicketsEntity, {channel: interaction.channel?.id});

        if (ticketData?.header == null) {
            const ticketComponents: ActionRowBuilder<any> = new ActionRowBuilder().addComponents(
                TicketButtons.UNLOCK.toValue(), 
                TicketButtons.LOCK.toValue(), 
                TicketButtons.CLOSE.toValue());
            interaction.reply({ content: "This ticket has no header message. Here's a temporary toolset instead.", ephemeral: true, components: [ticketComponents]})
            return;
        }
        interaction.channel?.messages.fetch(ticketData?.header!).then(message => {
            const link = messageLink(interaction.channelId, message.id);
            const embed = new EmbedBuilder()
                .setColor("#82b2d7")
                .setTitle("Go to controls")
                .setURL(link)
        
            interaction.reply({embeds: [embed], ephemeral: true})
        })
    }

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
        // if member is not staff, cancel
        if (!Util.isStaff(interaction.member as GuildMember)) {
            interaction.reply({ content: "You are not able to execute that action.", ephemeral: true})
            return;
        }

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
        // if member is not staff, cancel
        if (!Util.isStaff(interaction.member as GuildMember)) {
            interaction.reply({ content: "You are not able to execute that action.", ephemeral: true})
            return;
        }
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
        // if member is not staff, cancel
        if (!Util.isStaff(interaction.member as GuildMember)) {
            interaction.reply({ content: "You are not able to execute that action.", ephemeral: true})
            return;
        }
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

    // insert a channel into the ticket system
    @Slash("insert", {defaultMemberPermissions: PermissionFlagsBits.Administrator})
    @SlashGroup("ticket")
    // command options
    async insert(
        @SlashOption("channel", { description: "Channel to insert", required: true, type: ApplicationCommandOptionType.Channel, channelTypes: [ChannelType.GuildText] }) channel: TextChannel,
        // type slash option with 2 choices, one for ticket or one for request
        @SlashChoice({ name: "ticket", value: "ticket"})
        @SlashChoice({ name: "request", value: "request"})
        @SlashOption("type", { description: "Type of ticket", required: true, type: ApplicationCommandOptionType.String }) type: string,
        @SlashOption("user", { description: "User that created channel", required: true, type: ApplicationCommandOptionType.User }) user: User,
        @SlashOption("handler", { description: "User that will handle the ticket", required: true, type: ApplicationCommandOptionType.User }) handler: User,
        interaction: CommandInteraction
    )
    // command execution
    {
        // if member is not staff, cancel
        if (!Util.isStaff(interaction.member as GuildMember)) {
            interaction.reply({ content: "You are not able to execute that action.", ephemeral: true})
            return;
        }
        // insert channel into the ticket system
        const ticket = new TicketsEntity();
        ticket.channel = channel.id;
        ticket.name = channel.name;
        ticket.type = type;
        ticket.user = user.id;
        ticket.handler = handler.id;
        await AppDataSource.getRepository(TicketsEntity).insert(ticket);
        interaction.reply({ content: "Channel inserted into the ticket system.", ephemeral: true})
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
    
    /**
     * checks if a channel is in a valid support category
     * @param channels the channel manager to get the channel information from
     * @param channelId the id of the channel the manager should fetch
     * @returns true if channel is in valid support category
     */
    private async inValidCategory(channels: GuildChannelManager | undefined, channelId: string): Promise<boolean> {
        if (channels === undefined) return false;

        const channelInstance = await channels.fetch(channelId);
        const categoryId = channelInstance?.parentId;
        
        // if channel isn't in support category, return false
        if (categoryId != process.env.TICKET_CATEGORY && categoryId != process.env.COMMISSION_CATEGORY) {
            return false;
        }

        return true;
    }

}