import { GuildChannelManager, GuildMember } from "discord.js";

export class Util {

    /**
     * checks if the roles of a member contain any role that says
     * the member is staff
     * @param member member to check the roles of
     * @returns true if member is a staff member
     */
     public static isStaff(member: GuildMember): boolean {
        return member.roles.cache.some(role => role.name === "Manager" || role.name === "Support")
    }

    /**
     * checks if the roles of a member contain a admin level role
     * @param member member to check the roles of
     * @returns true if member is an admin
     */
     public static isAdmin(member: GuildMember): boolean {
        return member.roles.cache.some(role => role.name === "Manager")
    }

    /**
     * capitalizes the first letter of a string
     * @param input string to capitalize first letter of
     * @returns the string with the first letter capitalized
     */
     public static capFirst(input: string) {
        return input.charAt(0).toUpperCase() + input.slice(1);
    }

    /**
     * checks if a channel is in a valid support category
     * @param channels the channel manager to get the channel information from
     * @param channelId the id of the channel the manager should fetch
     * @returns true if channel is in valid support category
     */
     public static async inSupportCategory(channels: GuildChannelManager | undefined, channelId: string): Promise<boolean> {
        if (channels === undefined) return false;

        const channelInstance = await channels.fetch(channelId);
        const categoryId = channelInstance?.parentId;
        
        // if channel isn't in support category, return false
        if (categoryId != process.env.TICKET_CATEGORY && categoryId != process.env.COMMISSION_CATEGORY) {
            return false;
        }

        return true;
    }

}