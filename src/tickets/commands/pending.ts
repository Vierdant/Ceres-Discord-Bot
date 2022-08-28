import { ApplicationCommandOptionType, CommandInteraction, EmbedBuilder } from "discord.js";
import { Discord, SlashGroup, Slash, SlashOption } from "discordx";
import { AppDataSource } from "../../database/data-source.js";
import { TicketsEntity } from "../../database/entity/tickets.js";
import { PermissionSet } from "../../enums/permissions.js";
import { ValidateTicketCommand } from "./validate.js";

@Discord()
@SlashGroup({ name: "ticket", description: "Ticket commands" })
export class PendingTicketCommand {

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
 
         const validation = await ValidateTicketCommand(interaction, {
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
}