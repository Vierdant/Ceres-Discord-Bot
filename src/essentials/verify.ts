import { ButtonInteraction, GuildMember } from "discord.js";
import { ButtonComponent, Discord } from "discordx";

@Discord()
export class verify {
    
    @ButtonComponent("verify_server_member")
    async verify(interaction: ButtonInteraction) {
        // if has Member role then verified
        const member = interaction.member;
        if (!member) {
            interaction.reply({ content: "You are not a member of this server.", ephemeral: true });
            return;
        }

        if ((member as GuildMember).roles.cache.some(role => role.name === "Member")) {
            interaction.reply({ content: "You are already verified.", ephemeral: true });
            return;
        }

        // add Member role
        const memberRole = (member as GuildMember).guild.roles.cache.find(role => role.name === "Member");
        await (member as GuildMember).roles.add(memberRole!);
        interaction.reply({ content: "You are now verified. Welcome to the server.", ephemeral: true });
    }
}