import { SelectMenuInteraction } from "discord.js";
import { Discord, SelectMenuComponent } from "discordx";
import { EmbedTemplate } from "../embeds/template.js";

@Discord()
export class AboutRolesInfo {

    @SelectMenuComponent("about-roles-menu")
    async handle(interaction: SelectMenuInteraction): Promise<unknown> {

        // extract selected value by member
        const roleValue = interaction.values?.[0];

        // if value not found
        if (!roleValue) {
            return interaction.reply({ content: "Invalid role", ephemeral: true });
        }

        const embed = await new EmbedTemplate(`about/${roleValue}`).load();

        interaction.reply({ content: `<@${interaction.user.id}>, here's the information you have requested:`, embeds: [embed], ephemeral: true });

        return;
    }

}