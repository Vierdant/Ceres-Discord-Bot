import { EmbedBuilder, GuildMember } from "discord.js";
import { Discord, On } from "discordx";
import type { ArgsOf } from "discordx";
import { AppDataSource } from "../database/data-source.js";
import { TicketsEntity } from "../database/entity/tickets.js";
import { Util } from "../util.js";

@Discord()
export class PendingListener {

    @On("messageCreate")
    async onMessage([message]: ArgsOf<"messageCreate">) {
        // if member is staff, cancel
        if (Util.isStaff(message.member as GuildMember) || message.author.bot) {
            return;
        }

        // if channel isn't in support channel, cancel
        if (!await Util.inSupportCategory(message.guild?.channels, message.channelId)) {
            return;
        }

        // get channel data
        const ticketData = await AppDataSource.manager.findOneBy(TicketsEntity, {channel: message.channel?.id});
        const ticketStatus = ticketData?.status;
        const userId = ticketData?.user;
        const ticketType = ticketData?.type;
        const handlerId = ticketData?.handler;
        
        if (ticketStatus != "PENDING") {
            return;
        }

        const handler = await message.guild?.members.fetch(handlerId as string)
        
        const embed = new EmbedBuilder()
            .setTitle(`A pending ${ticketType} received a reponse`)
            .setColor("#FFEA7F")
            .setTimestamp(Date.now())
            .addFields(
                { name: `${Util.capFirst(ticketType!)}`, value: `<#${message.channelId}>`, inline: true},
                { name: "Response by", value: `<@${message.author.id}>`, inline: true},
                { name: "Created by", value: `<@${userId}>`, inline: true},
                { name: "Note", value: `Please respond to the ${ticketType} at your earliest convenience.`, inline: false}
            )

        handler?.createDM().then(channel => {
            channel.send({embeds: [embed]})
        })

        message.channel.send({ content: `<@${handlerId}>`}).then(message => {
            message.delete();
        })

        // update database
        AppDataSource
            .createQueryBuilder()
            .update(TicketsEntity)
            .set({ status: "OPEN" })
            .where("channel = :channel", { channel: message.channelId })
            .execute()
    }
}