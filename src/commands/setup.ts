import { ActionRowBuilder, ApplicationCommandOptionType, ButtonBuilder, ButtonStyle, ChannelType, CommandInteraction, PermissionFlagsBits, SlashCommandChannelOption, TextChannel } from "discord.js";
import { Discord, Slash, SlashGroup, SlashOption } from "discordx";
import { EmbedTemplate } from "../embeds/template.js";
import { TicketButtons } from "../enums/buttons.js"

@Discord()
@SlashGroup({ name: "setup", description: "Setup defaults" })
export class SetupCommand {

  /**
   * setup the ticket channel, where users open tickets/requests channels
   * setup ticket <where (e.x #ceres-dev)>
   * @param channel the channel where the ticket setup should be sent to
   * @param interaction the interaction with the setup command
   */
  @Slash("ticket", {defaultMemberPermissions: PermissionFlagsBits.Administrator})
  @SlashGroup("setup")
  // command options
  async ticket(
    @SlashOption("where", { description: "where to post", type: ApplicationCommandOptionType.Channel, channelTypes: [ChannelType.GuildText], required: true }) channel: TextChannel,
    interaction: CommandInteraction
  )
  // command execution
  {
    if (channel.type != ChannelType.GuildText) {
      interaction.reply("You need to choose a text channel.")
      return;
    }
    // generate channel content
    const embed = await new EmbedTemplate("tickets").load();
    const components: ActionRowBuilder<any> = new ActionRowBuilder().addComponents(
      TicketButtons.CREATE_TICKET.toValue(), 
      TicketButtons.CREATE_REQUEST.toValue());
    channel.send?.({embeds: [embed], components: [components]});
    interaction.reply("Sent the ticket default setup to <#" + channel.id + ">");
  }
}
