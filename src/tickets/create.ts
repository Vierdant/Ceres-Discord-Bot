import { ActionRowBuilder, ButtonInteraction, ChannelType, EmbedBuilder, Message, ModalBuilder, ModalSubmitInteraction, Options, TextBasedChannel, TextChannel, User } from "discord.js";
import { ButtonComponent, ModalComponent, Discord } from "discordx";
import { v4 as uuid } from "uuid";
import { EmbedTemplate } from "../embeds/template.js";
import { TicketButtons } from "../enums/buttons.js";
import { PermissionSet } from "../enums/permissions.js"
import { TicketModalEntries } from "../enums/textfields.js";
import { AppDataSource } from "../database/data-source.js";
import { TicketsEntity } from "../database/entity/tickets.js";

@Discord()
export class CreateTicket {

    /**
     * displays a modal for the user before creating the ticket channel
     * @param interaction the interaction with the support ticket button
     */

    @ButtonComponent("create_ticket")
    async display(interaction: ButtonInteraction) {

        const modal = new ModalBuilder()
            .setTitle("Support Ticket")
            .setCustomId("support_ticket")
            .setComponents(TicketModalEntries.SUPPORT_TICKET.toArray());

        await interaction.showModal(modal);
    }

    /**
     * creates a channel under the ticket category and sets it up as a ticket channel
     * note that this establishes a request with the database to input the ticket entry
     * @param interaction the interaction with the ticket creation modal
     */
    @ModalComponent("support_ticket")
    async create(interaction: ModalSubmitInteraction) {
        // used when assigning the channel name during creation
        const ticketId = this.getTicketId(interaction.user);
        // welcome embed is sent as the first component of header message
        const welcomeEmbed = await new EmbedTemplate("support_ticket").load();

        // gets the modal information to create the ticket details embed
        const [subject, explanation] = ["subject", "explanation"].map((id) =>
            interaction.fields.getTextInputValue(id)
        );

        const detailsEmbed = new EmbedBuilder()
            .setColor("#FFEA7F")
            .addFields(
                {name: "Subject", value: subject, inline: false},
                {name: "Explanation", value: explanation, inline: false}
            );
        
        // essential buttons to be displayed on the header message
        const ticketComponents: ActionRowBuilder<any> = new ActionRowBuilder().addComponents(
            TicketButtons.CLAIM.toValue(), 
            TicketButtons.LOCK.toValue(), 
            TicketButtons.CLOSE.toValue());

        interaction.guild?.channels.create({
            parent: process.env.TICKET_CATEGORY, 
            name: "ticket-" + ticketId, 
            type: ChannelType.GuildText, 
            reason: "User created a support ticket channel",
            permissionOverwrites: [
                {
                    id: interaction.user.id,
                    allow: PermissionSet.FULL_CHAT_ACCESS.toArrayList()
                },
                {
                    id: process.env.SUPPORTER_ROLE as string,
                    allow: PermissionSet.STAFF_CHAT_ACCESS.toArrayList()
                }
            ]
        })
        .then((channel) => {
            // send header message
            channel.send({embeds: [welcomeEmbed, detailsEmbed], components: [ticketComponents]}).then((message) => {
                // insert database entry now that all information is available
                this.insertTicketEntry(channel, interaction.user, message)
            })

            

            // send appreciation message and ghost ping
            interaction.reply({ content: "Thank you for creating a ticket. Your ticket is: <#" + channel.id + ">", ephemeral: true })
            channel.send("<@" + interaction.user.id + ">").then((message) => {
                message.delete();
            })
        })
    }

    /**
     * Generates a user unique id to be assigned to a ticket name created by user
     * @param user The user to get the id from
     * @returns a user id merged with a generated uuid for a ticket channel
     */

    private getTicketId(user: User): string {
        return user.id.slice(-2) + uuid().slice(-4)
    }

    /**
     * Inserts a new ticket entry in the database using the channel
     * and user values to determine the data sets
     * @param channel channel to fetch the data from
     * @param user user to the fetch the data from
     * @param message message to register
     */
    private async insertTicketEntry(channel: TextChannel, user: User, message: Message<boolean>) {
        const ticketEntry = new TicketsEntity();
        ticketEntry.name = channel.name;
        ticketEntry.type = "ticket";
        ticketEntry.channel = channel.id;
        ticketEntry.user = user.id;
        ticketEntry.header = message.id;

        await AppDataSource.manager.save(ticketEntry)
    }
}


@Discord()
export class CreateRequest {

    /**
     * displays a modal for the user before creating the request channel
     * @param interaction the interaction with the commission request button
     */

    @ButtonComponent("create_request")
    async display(interaction: ButtonInteraction) {

        const modal = new ModalBuilder()
            .setTitle("Support Ticket")
            .setCustomId("commission_request")
            .setComponents(TicketModalEntries.COMMISSION_REQUEST.toArray());

        await interaction.showModal(modal);
    }

    /**
     * creates a channel under the request category and sets it up as a request channel
     * note that this establishes a request with the database to input the ticket entry
     * @param interaction the interaction with the request creation modal
     */
    @ModalComponent("commission_request")
    async create(interaction: ModalSubmitInteraction) {
        // used when assigning the channel name during creation
        const ticketId = this.getTicketId(interaction.user);
        // welcome embed is sent as the first component of header message
        const welcomeEmbed = await new EmbedTemplate("commission_request").load();

        // gets the modal information to create the ticket details embed
        const [request, category, budget, explanation] = ["request", "category", "budget", "explanation"].map((id) =>
            interaction.fields.getTextInputValue(id)
        );

        const detailsEmbed = new EmbedBuilder()
            .setColor("#B580BD")
            .addFields(
                {name: "Request", value: request, inline: false},
                {name: "Category", value: category, inline: false},
                {name: "Budget", value: budget, inline: false},
                {name: "Explanation", value: explanation, inline: false}
            );
        
        // essential buttons to be displayed on the header message
        const ticketComponents: ActionRowBuilder<any> = new ActionRowBuilder().addComponents(
            TicketButtons.CLAIM.toValue(), 
            TicketButtons.LOCK.toValue(), 
            TicketButtons.CLOSE.toValue());

        interaction.guild?.channels.create({
            parent: process.env.COMMISSION_CATEGORY, 
            name: "request-" + ticketId, 
            type: ChannelType.GuildText, 
            reason: "User created a commission request channel",
            permissionOverwrites: [
                {
                    id: interaction.user.id,
                    allow: PermissionSet.FULL_CHAT_ACCESS.toArrayList()
                },
                {
                    id: process.env.SUPPORTER_ROLE as string,
                    allow: PermissionSet.STAFF_CHAT_ACCESS.toArrayList()
                }
            ]
        })
        .then((channel) => {
            // send header message
            channel.send({embeds: [welcomeEmbed, detailsEmbed], components: [ticketComponents]}).then((message) => {
                // insert database entry now that all information is available
                this.insertTicketEntry(channel, interaction.user, message)
            })

            

            // send appreciation message and ghost ping
            interaction.reply({ content: "Thank you for choosing Returned Studios. Your request is: <#" + channel.id + ">", ephemeral: true })
            channel.send("<@" + interaction.user.id + ">").then((message) => {
                message.delete();
            })
        })
    }

    /**
     * Generates a user unique id to be assigned to a ticket name created by user
     * @param user The user to get the id from
     * @returns a user id merged with a generated uuid for a ticket channel
     */

    private getTicketId(user: User): string {
        return user.id.slice(-2) + uuid().slice(-5)
    }

    /**
     * Inserts a new ticket entry in the database using the channel
     * and user values to determine the data sets
     * @param channel channel to fetch the data from
     * @param user user to the fetch the data from
     * @param message message to register
     */
    private async insertTicketEntry(channel: TextChannel, user: User, message: Message<boolean>) {
        const ticketEntry = new TicketsEntity();
        ticketEntry.name = channel.name;
        ticketEntry.type = "request";
        ticketEntry.channel = channel.id;
        ticketEntry.user = user.id;
        ticketEntry.header = message.id;

        await AppDataSource.manager.save(ticketEntry)
    }
}