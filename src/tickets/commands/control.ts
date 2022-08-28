import { CommandInteraction, ActionRowBuilder, EmbedBuilder, MessageActionRowComponentBuilder, messageLink } from "discord.js";
import { Discord, SlashGroup, Slash } from "discordx";
import { TicketButtons } from "../../enums/buttons.js";
import { PermissionSet } from "../../enums/permissions.js";
import { ValidateTicketCommand } from "./validate.js";

@Discord()
@SlashGroup({ name: "ticket", description: "Ticket commands" })
export class ControlTicketCommand {

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
 
         const validation = await ValidateTicketCommand(interaction, {category: true});
 
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
}