import { ActionRowBuilder, ButtonInteraction, ChannelType, EmbedBuilder, Guild, GuildChannelManager, GuildMember, ModalBuilder, ModalSubmitInteraction} from "discord.js";
import { ButtonComponent, Discord, ModalComponent } from "discordx";
import { AppDataSource } from "../database/data-source.js";
import { TicketsEntity } from "../database/entity/tickets.js";
import { TicketButtons } from "../enums/buttons.js";
import { TicketModalEntries } from "../enums/textfields.js";
import discordTranscripts from "discord-html-transcripts"
import { Util } from "../util.js";

@Discord()
export class TicketControlButtons {
    /**
     * handle claiming of tickets
     */
    @ButtonComponent("claim_ticket")
    async claim(interaction: ButtonInteraction) {
        // if member is not staff, cancel
        if (!Util.isStaff(interaction.member as GuildMember)) {
            interaction.reply({ content: "You are not able to execute that action.", ephemeral: true})
            return;
        }

        // get channel data
        const ticketData = await AppDataSource.manager.findOneBy(TicketsEntity, {channel: interaction.channel?.id});
        
        const ticketType = ticketData?.type;
        const ticketStatus = ticketData?.status;
        const header = ticketData?.header == null ? interaction.message.id : ticketData?.header;
        const handler = ticketData?.handler;

        if (ticketStatus === "LOCKED") {
            interaction.reply({ content: `This ${ticketType} is locked. Locked ${ticketType}s are not eligable to changes.`, ephemeral: true})
            return;
        }

        // if handler is not null then something happened that wasn't supposed to happen
        if (handler != null) {
            interaction.reply({ content: `You can't claim this ${ticketType} because it's already claimed.`, ephemeral: true})
            return;
        }

        interaction.channel?.messages.fetch(header!).then(message => {
            const editedEmbed = new EmbedBuilder(ticketData?.header == undefined ? {} : message.embeds[0].data)
                .setFooter({ 
                    text: `This ${ticketType} has been claimed by ${interaction.user.username}`, 
                    iconURL: interaction.user.displayAvatarURL() 
                })

            const claimEmbed = new EmbedBuilder()
                .setColor("#FFEA7F")
                .setAuthor({ name: `${Util.capFirst(ticketType!)} claimed`, iconURL: interaction.user.displayAvatarURL() })
                .setDescription(`Your ${ticketType} will be handled by <@${interaction.user.id}>`)
            
            if (ticketData?.header != null || undefined) {
                const editedComponenets: ActionRowBuilder<any> = new ActionRowBuilder().addComponents(
                    TicketButtons.LOCK.toValue(), 
                    TicketButtons.CLOSE.toValue());
                
                message.edit({embeds: [editedEmbed, message.embeds[1]], components: [editedComponenets]})
            }

            interaction.reply({embeds: [claimEmbed], ephemeral: false})
            
            // update database
            AppDataSource
                .createQueryBuilder()
                .update(TicketsEntity)
                .set({ handler: interaction.user.id })
                .where("channel = :channel", { channel: interaction.channelId })
                .execute()
        });
    }

    /**
     * handle locking of tickets
     */
    @ButtonComponent("lock_ticket")
    async lock(interaction: ButtonInteraction) {
        // if member is not staff, cancel
        if (!Util.isStaff(interaction.member as GuildMember)) {
            interaction.reply({ content: "You are not able to execute that action.", ephemeral: true})
            return;
        }

        // get channel data
        const ticketData = await AppDataSource.manager.findOneBy(TicketsEntity, {channel: interaction.channel?.id});
        
        const ticketType = ticketData?.type;
        const ticketStatus = ticketData?.status;
        const header = ticketData?.header == null ? interaction.message.id : ticketData?.header;

        if (ticketStatus === "LOCKED") {
            interaction.reply({ content: `This ${ticketType} is already locked.`, ephemeral: true})
            return;
        }

        let viewers = JSON.parse(ticketData?.viewers === undefined ? "[]" : ticketData?.viewers as string);
        viewers.push(ticketData?.user)
        this.toggleChatAccess(interaction.guild, interaction.channelId, viewers, false);

        interaction.channel?.messages.fetch(header!).then(message => {
            const editedEmbed = new EmbedBuilder(ticketData?.header == undefined ? {} : message.embeds[0].data)
                .setColor("#B580BD")

            const claimEmbed = new EmbedBuilder()
                .setColor("#FFEA7F")
                .setAuthor({ name: `${Util.capFirst(ticketType!)} locked`})
                .setDescription(`Your ${ticketType} was locked by <@${interaction.user.id}>`)

            if (ticketData?.header != null || undefined) {
                const editedComponenets: ActionRowBuilder<any> = new ActionRowBuilder().addComponents(
                    TicketButtons.UNLOCK.toValue(),
                    TicketButtons.CLOSE.toValue());
                
                message.edit({embeds: [editedEmbed, message.embeds[1]], components: [editedComponenets]})
            }

            interaction.reply({embeds: [claimEmbed], ephemeral: false})
            
            // update database
            AppDataSource
                .createQueryBuilder()
                .update(TicketsEntity)
                .set({ status: "LOCKED" })
                .where("channel = :channel", { channel: interaction.channelId })
                .execute()
        });
    }

    /**
     * handle unlocking of tickets
     */
    @ButtonComponent("unlock_ticket")
    async unlock(interaction: ButtonInteraction) {
        // if member is not staff, cancel
        if (!Util.isStaff(interaction.member as GuildMember)) {
            interaction.reply({ content: "You are not able to execute that action.", ephemeral: true})
            return;
        }

        // get channel data
        const ticketData = await AppDataSource.manager.findOneBy(TicketsEntity, {channel: interaction.channel?.id});
        
        const ticketType = ticketData?.type;
        const ticketStatus = ticketData?.status;
        const header = ticketData?.header == null ? interaction.message.id : ticketData?.header;
        const handler = ticketData?.handler;

        if (ticketStatus === "OPEN") {
            interaction.reply({ content: `This ${ticketType} is already unlocked.`, ephemeral: true})
            return;
        }
        
        let viewers = JSON.parse(ticketData?.viewers === undefined ? "[]" : ticketData?.viewers as string);
        viewers.push(ticketData?.user)
        this.toggleChatAccess(interaction.guild, interaction.channelId, viewers, true);

        interaction.channel?.messages.fetch(header!).then(message => {
            const editedEmbed = new EmbedBuilder(ticketData?.header == undefined ? {} : message.embeds[0].data)
                .setColor("#82b2d7")

            const claimEmbed = new EmbedBuilder()
                .setColor("#B3D998")
                .setAuthor({ name: `${Util.capFirst(ticketType!)} unlocked`})
                .setDescription(`Your ${ticketType} was unlocked by <@${interaction.user.id}>`)

            if (ticketData?.header != null || undefined) {
                const editedComponenets: ActionRowBuilder<any> = 
                handler === null ? new ActionRowBuilder().addComponents(
                    TicketButtons.CLAIM.toValue,
                    TicketButtons.LOCK.toValue(),
                    TicketButtons.CLOSE.toValue()) :
                    new ActionRowBuilder().addComponents(
                        TicketButtons.LOCK.toValue(),
                        TicketButtons.CLOSE.toValue())
                
                message.edit({embeds: [editedEmbed, message.embeds[1]], components: [editedComponenets]})
            }

            interaction.reply({embeds: [claimEmbed], ephemeral: false})
            
            // update database
            AppDataSource
                .createQueryBuilder()
                .update(TicketsEntity)
                .set({ status: "OPEN" })
                .where("channel = :channel", { channel: interaction.channelId })
                .execute()
        });
    }


    /**
     * handle closing of tickets
     */
     @ButtonComponent("close_ticket")
     async close(interaction: ButtonInteraction) {
        const ticketData = await AppDataSource.manager.findOneBy(TicketsEntity, {channel: interaction.channel?.id});

        // if member is not staff, cancel
        if (!Util.isStaff(interaction.member as GuildMember) && interaction.user.id != ticketData?.user) {
             interaction.reply({ content: "You are not able to execute that action.", ephemeral: true})
             return;
        }

         const modal = new ModalBuilder()
            .setTitle("Are you sure?")
            .setCustomId("close_ticket")
            .setComponents(TicketModalEntries.CLOSE_TICKET.toArray());

        await interaction.showModal(modal);
    }

    /**
     * toggles the channel chat premissions of a user/group of users
     * @param guild the guild to get the channel/user information from
     * @param channelId the id of the channel the manager should fetch
     * @param users user(s) to change the permissions of
     * @param status the status of permissions, either true or false
     */
    private async toggleChatAccess(guild: Guild | null, channelId: string, users: any, status: boolean) {
        if (guild === null) { console.log("Failed to change channel access options | controller.ts"); return; }
        
        const fetchedChannel = await guild.channels.fetch(channelId);
        for (let user of users) {
            user = await guild.members.fetch(user);
            fetchedChannel?.permissionOverwrites.create(user, { 
                ViewChannel: true, 
                ReadMessageHistory: true,
                AddReactions: status, 
                UseExternalEmojis: status,
                UseExternalStickers: status,
                AttachFiles: status,
                EmbedLinks: status,
                SendMessages: status
            })
        }
    }
}


@Discord()
export class TicketControlModals {
    @ModalComponent("close_ticket")
    async close(interaction: ModalSubmitInteraction) {
        const closeEmbed = new EmbedBuilder()
            .setTitle("**Thank you for choosing Returned Studios**")
            .setColor("#B580BD")
        const channelId = interaction.channelId;

        // gets the modal information to create the ticket details embed
        const [reason] = ["reason"].map((id) =>
            interaction.fields.getTextInputValue(id)
        );

        // get channel data
        const ticketData = await AppDataSource.manager.findOneBy(TicketsEntity, {channel: interaction.channel?.id});
        
        const ticketType = ticketData?.type;
        const userId = ticketData?.user;
        const user = await interaction.guild?.members.fetch(userId as string)
        
        closeEmbed.setDescription(`The ${ticketType} will be deleted in 10 seconds.`)
        const closedEmbed = new EmbedBuilder()
            .setColor("#B580BD")
            .setTitle(`Your ${ticketType} was closed`)
            .setDescription(`Thank you for choosing Returned Studios.`)
            .addFields(
                { name: "Closed by", value: `<@${interaction.user.id}>`, inline: false},
                { name: "Reason", value: reason, inline: false },
                { name: "How to Review", value: "Simply click on the button assigned to this message.\nOnce you click on the button, it will **dissappear** for **1 minute**.\n**Spamming** reviews will get you blacklisted from using our services.\n\nThank you <3", inline: false}
            )
        // if it's a request, add review button else add feedback button
        const reviewButton: ActionRowBuilder<any> = new ActionRowBuilder().addComponents( 
            ticketType === "request" ? TicketButtons.REVIEW.toValue() : TicketButtons.FEEDBACK.toValue() 
        )

        interaction.reply({ embeds: [closeEmbed], fetchReply: true }).then(message => {
            this.generateTranscript(interaction.guild?.channels, interaction.channel, ticketData, reason, interaction.user.id)
            
            setTimeout( () => {
                message.channel.delete().then(i => {
                    user?.createDM().then(dm => { dm.send( { embeds: [closedEmbed], components: [reviewButton]} )})
                });
            }, 10000)
        })

        await AppDataSource
            .createQueryBuilder()
            .delete()
            .from(TicketsEntity)
            .where("channel = :channel", { channel: channelId })
            .execute();

    }

    /**
     * creates a transcript for a ticket that was closed
     * @param channels the manager of the interaction
     * @param channel the channel that should be transcripted
     * @param ticketData the ticket data
     * @param reason the reason for closing
     * @param userId the user id of who closed the ticket
     */
    private async generateTranscript(channels: GuildChannelManager | undefined, channel: any, ticketData: TicketsEntity | null, reason: string, userId: string) {
        if (channels === undefined) { console.log("Failed to generate transcript | controller.ts"); return; }
        if (ticketData === null) return;

        const transcriptChannel = channels.cache.get(process.env.TRANSCRIPT_CHANNEL as string)
        // genereate transcript message
        const transcriptEmbed = new EmbedBuilder()
            .setColor(ticketData.type === "ticket" ? "#82b2d7" : "#B580BD")
            .setTitle(`${Util.capFirst(ticketData.type as string)} was closed`)
            .setTimestamp(Date.now())
            .setFooter({text: "Transcript is attached to this message"})
            .addFields(
                { name: "Name", value: ticketData?.name as string, inline: true},
                { name: "Opened by", value: `<@${ticketData.user}>`, inline: true},
                { name: "Closed by", value: `<@${userId}>`, inline: true},
                { name: "Reason", value: reason, inline: false}
            )
        // get transcript
        const transcript = await discordTranscripts.createTranscript(channel, {
            limit: -1,
            returnType: 'attachment',
            fileName: `${ticketData.name}.html`,
            minify: false,
            saveImages: true,
            useCDN: false
        })

        // send transcript
        if (transcriptChannel?.type === ChannelType.GuildText) {
            transcriptChannel.send({ embeds: [transcriptEmbed], files: [transcript]})
        }
    }
}
