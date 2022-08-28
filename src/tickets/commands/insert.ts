import { PermissionFlagsBits, ApplicationCommandOptionType, ChannelType, TextChannel, User, CommandInteraction } from "discord.js";
import { Discord, SlashGroup, Slash, SlashOption, SlashChoice } from "discordx";
import { AppDataSource } from "../../database/data-source.js";
import { TicketsEntity } from "../../database/entity/tickets.js";

@Discord()
@SlashGroup({ name: "ticket", description: "Ticket commands" })
export class InsertTicketCommand {

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
}