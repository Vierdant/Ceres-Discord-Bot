import { ActionRowBuilder, ApplicationCommandOptionType, ChannelType, CommandInteraction, MessageActionRowComponentBuilder, PermissionFlagsBits, SelectMenuBuilder, TextChannel } from "discord.js";
import { Discord, Slash, SlashGroup, SlashOption } from "discordx";
import { EmbedTemplate } from "../../embeds/template.js";
import { EssentialButtons, TicketButtons } from "../../enums/buttons.js"
import { SelectOptions } from "../../enums/selectoptions.js";

/**
 * Represents a command that sets up displayable information for different channels
 */
@Discord()
@SlashGroup({ name: "setup", description: "Setup defaults" })
@SlashGroup({
    name: "about",
    description: "about sections setup",
    root: "setup"
  })
export class SetupCommand {

	// ticket setup command
	@Slash("ticket", { defaultMemberPermissions: PermissionFlagsBits.Administrator })
	@SlashGroup("setup")
	async ticket(
		@SlashOption("where", { description: "where to post", type: ApplicationCommandOptionType.Channel, channelTypes: [ChannelType.GuildText], required: true }) channel: TextChannel,
		interaction: CommandInteraction
	) { 
		// command execution
		if (channel.type != ChannelType.GuildText) {
			interaction.reply("You need to choose a text channel.")
			return;
		}
		// generate channel content
		const embed = await new EmbedTemplate("tickets").load();

		const components: ActionRowBuilder<MessageActionRowComponentBuilder> = 
		new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
			TicketButtons.CREATE_TICKET.toValue(),
			TicketButtons.CREATE_REQUEST.toValue()
		);

		channel.send?.({ embeds: [embed], components: [components] });
		interaction.reply("Sent the ticket default setup to <#" + channel.id + ">");
	}


	// welcome setup command
	@Slash("welcome", { defaultMemberPermissions: PermissionFlagsBits.Administrator })
	@SlashGroup("setup")
	async welcome(
		@SlashOption("where", { description: "where to post", type: ApplicationCommandOptionType.Channel, channelTypes: [ChannelType.GuildText], required: true }) channel: TextChannel,
		interaction: CommandInteraction
	) {
		// command execution
		if (channel.type != ChannelType.GuildText) {
			interaction.reply("You need to choose a text channel.")
			return;
		}

		// generate channel content
		const embed = await new EmbedTemplate("welcome/welcome").load();
		const embedHowTo = await new EmbedTemplate("welcome/welcome-howto").load();
		const embedVerify = await new EmbedTemplate("welcome/welcome-verify").load();

		const components: ActionRowBuilder<MessageActionRowComponentBuilder> 
		= new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
			EssentialButtons.VERIFY.toValue()
		);

		await channel.send?.({ embeds: [embed], files: [{ attachment: "./src/assets/Welcome-Header.png", name: "welcome-header.png" }] });
		channel.send?.({ embeds: [embedHowTo, embedVerify], components: [components], files: [{ attachment: "./src/assets/Welcome-HowToStart.png", name: "welcome-howtostart.png" }] });
	
		interaction.reply("Sent the welcome default setup to <#" + channel.id + ">");
	}
	


	// welcome about roles command
	@Slash("roles", { defaultMemberPermissions: PermissionFlagsBits.Administrator })
	@SlashGroup("about", "setup")
	async aboutRoles(
		@SlashOption("where", { description: "where to post", type: ApplicationCommandOptionType.Channel, channelTypes: [ChannelType.GuildText], required: true }) channel: TextChannel,
		interaction: CommandInteraction
	) {
		// command execution
		if (channel.type != ChannelType.GuildText) {
			interaction.reply("You need to choose a text channel.")
			return;
		}

		// generate channel content
		const embed = await new EmbedTemplate("welcome/welcome-aboutroles").load();

		const components: ActionRowBuilder<MessageActionRowComponentBuilder> 
		= new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
			new SelectMenuBuilder()
      			.addOptions(SelectOptions.ABOUT_ROLES.toArray())
      			.setCustomId("about-roles-menu")
		  );

		channel.send?.({ embeds: [embed], files: [{ attachment: "./src/assets/Welcome-AboutRoles.png", name: "welcome-aboutroles.png" }], components: [components] });
	
		interaction.reply("Sent the about roles welcome section default setup to <#" + channel.id + ">");
	}
}
