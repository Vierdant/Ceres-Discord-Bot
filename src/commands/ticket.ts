import { error } from "console";
import { ActionRowBuilder, ApplicationCommandOptionType, ChannelType, CommandInteraction, EmbedBuilder, GuildChannelManager, GuildMember, MessageActionRowComponentBuilder, messageLink, PermissionFlagsBits, Role, TextChannel, User } from "discord.js";
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
    root: "ticket"
  })
export class ticketCommand {

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

        const validation = await this.ValidateTicketCommand(interaction, {
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

        const validation = await this.ValidateTicketCommand(interaction, {
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

        const validation = await this.ValidateTicketCommand(interaction, {
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

        const validation = await this.ValidateTicketCommand(interaction, {
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

        const validation = await this.ValidateTicketCommand(interaction, {
            category: true,
            ifLocked: true,
            ifPending: true,
            NotClaimedPending: true,
            
        });

        if (!validation.ok) return;

        const data = validation.data!;

        const user = await interaction.guild?.members.fetch(data.user);
        
        const pendingEmbed = new EmbedBuilder()
            .setTitle(`This ${data.type} is now pending.`)
            .setColor("#FFEA7F")
            .setDescription(`The next message sent by a user will\nnotify the staff member handling the ${data.type}.`)
            .setTimestamp(Date.now())
            .setFooter({text: `Set by: ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL()})

        const dmEmbed = new EmbedBuilder()
            .setTitle(`Your ${data.type} is now pending.`)
            .setColor("#FFEA7F")
            .setDescription(`A ${data.type} created by you has been set to pending and is now awaiting your response.\nWhen you respond to the ${data.type}, it will notify the person handling your ${data.type}.\n\nNote that if there are other users added to the ${data.type}, a reposne from them\nwill notify the handler as well.`)
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

        const validation = await this.ValidateTicketCommand(interaction, {category: true});

        if (!validation.ok) return;

        const data = validation.data!;

        if (data.header == null) {
            const ticketComponents: ActionRowBuilder<MessageActionRowComponentBuilder> 
            = new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
                TicketButtons.UNLOCK.toValue(), 
                TicketButtons.LOCK.toValue(), 
                TicketButtons.CLOSE.toValue()
            );

            interaction.reply({ content: "This ticket has no header message. Here's a temporary toolset instead.", ephemeral: true, components: [ticketComponents]})
            return;
        }
        interaction.channel?.messages.fetch(data.header!).then(message => {
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

    // insert a channel into the ticket system
    @Slash("insert", {defaultMemberPermissions: PermissionFlagsBits.Administrator})
    @SlashGroup("ticket")
    // command options
    async insert(
        @SlashOption("channel", { description: "Channel to insert", required: true, type: ApplicationCommandOptionType.Channel, channelTypes: [ChannelType.GuildText] }) channel: TextChannel,
        // type slash option with 2 choices, one for ticket or one for request
        @SlashChoice("ticket", "request")
        @SlashOption("type", { description: "Type of ticket", required: true, type: ApplicationCommandOptionType.String }) type: string,
        @SlashOption("user", { description: "User that created channel", required: true, type: ApplicationCommandOptionType.User }) user: User,
        @SlashOption("handler", { description: "User that will handle the ticket", required: true, type: ApplicationCommandOptionType.User }) handler: User,
        interaction: CommandInteraction
    )
    // command execution
    {
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

    private async ValidateTicketCommand(interaction: CommandInteraction, conditions: {
        category?: boolean,
        force?: boolean,
        notclaimedByYouWithForce?: boolean,
        forceStatus?: boolean,
        ifLocked?: boolean,
        ifPending?: boolean,
        NotClaimedPending?: boolean,
        ifUnlocked?: boolean,
        ifNotClaimed?: boolean,
        notClaimedByYou?: boolean,
        assignee?: User,
        added?: User
    
    }): Promise<{ ok?: boolean, data?: TicketsEntity, who?: User }> {
        let who = undefined;
    
        if (conditions.category) {
    
            const channels = interaction.guild?.channels;
            const channelId = interaction.channelId;
        
            if (channels === undefined) return { ok: false };
    
            const channelInstance = await channels.fetch(channelId);
            const categoryId = channelInstance?.parentId;
            
            // if channel isn't in support category, return false
            if (categoryId != process.env.TICKET_CATEGORY && categoryId != process.env.COMMISSION_CATEGORY) {
                interaction.reply({ content: "This command can only be executed in a ticket/request channel.", ephemeral: true})
                return { ok: false };
            }
        }
    
        if (conditions.force) {
            const isAdmin = Util.isAdmin(interaction.member as GuildMember);
    
            // if command is being forced by someone that isn't admin, cancel
            if (conditions.forceStatus === true && isAdmin === false) {
                interaction.reply({ content: "Forcing unclaim is an admin only action.", ephemeral: true})
                return { ok: false };
            }
        }
    
        // get channel data
        const data = await AppDataSource.manager.findOneBy(TicketsEntity, {channel: interaction.channel?.id});
    
        if (!data) {
            interaction.reply({ content: "Could not find the ticket data.\nMajor error has occured. Please report this to a manager.", ephemeral: true})
            error(`Could not find the ticket data of channel ${interaction.channel?.id}. Request cancelled.\n Command Executor: ${interaction.user.username}`);
            return { ok: false };
        }
    
        if (conditions.ifLocked) {
            if (data.status === "LOCKED") {
                interaction.reply({ content: `This ${data.type} is locked. Locked ${data.type}s are not eligable to changes.`, ephemeral: true})
                return { ok: false };
            }
        }
    
        if (conditions.ifNotClaimed) {
            // if handler is null then the ticket is not claimed by anyone. So, cancel
            if (data.handler === null) {
                interaction.reply({ content: `This ${data.type} is not claimed by anyone. Failed to unclaim an unclaimed ${data.type}.`, ephemeral: true})
                return { ok: false };
            }
        }
    
        if (conditions.notclaimedByYouWithForce) {
            // if user doesn't own the ticket and forced is not true. Second check only is possible if user is admin
            if (data.handler != interaction.user.id && conditions.forceStatus != true) {
                interaction.reply({ content: `you can't unclaim a ${data.type} that isn't claimed by you.`, ephemeral: true})
                return { ok: false };
            }
        }
        
        if (conditions.added) {
            const addedMember = await interaction.guild?.members.fetch(conditions.added.id)
            who = addedMember === undefined ? who : addedMember.user;
    
            if (Util.isStaff(addedMember as GuildMember)) {
                interaction.reply({ content: `You can't modify a staff member's access to a support channel.`, ephemeral: true})
                return { ok: false };
            }
        }
    
        if (conditions.assignee) {
            const assigneeMember = await interaction.guild?.members.fetch(conditions.assignee.id);
            who = assigneeMember === undefined ? conditions.assignee : assigneeMember.user;
    
            if (!Util.isStaff(assigneeMember as GuildMember)) {
                interaction.reply({ content: `You are not able to assign a ${data.type} to a someone that is not a staff member`, ephemeral: true})
                return { ok: false };
            }
        }
    
        if (conditions.ifPending) {
            if (data.status === "PENDING") {
                interaction.reply({ content: `This ${data.type} is already pending.`, ephemeral: true})
                return { ok: false };
            }
        }
    
        if (conditions.NotClaimedPending) {
            if (data.handler != interaction.user.id) {
                interaction.reply({ content: `You can't set a ${data.type} that isn't claimed by you to pending.`, ephemeral: true})
                return { ok: false };
            }
        }
    
        return {
            ok: true,
            data: data,
            who: who
        }
    }
}