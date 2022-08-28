import { error } from "console";
import { User, CommandInteraction, GuildMember } from "discord.js";
import { AppDataSource } from "../../database/data-source.js";
import { TicketsEntity } from "../../database/entity/tickets.js";
import { Util } from "../../util.js";

type ValidationSettings = {
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
};

export const ValidateTicketCommand = async (interaction: CommandInteraction, conditions: ValidationSettings): Promise<{ ok?: boolean, data?: TicketsEntity, who?: User }> => {
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