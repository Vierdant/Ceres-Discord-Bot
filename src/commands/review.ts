import { ApplicationCommandOptionType, CommandInteraction, ModalBuilder, PermissionFlagsBits } from "discord.js";
import { Discord, Slash, SlashChoice, SlashGroup, SlashOption } from "discordx";
import { AppDataSource } from "../database/data-source.js";
import { ReviewsEntity } from "../database/entity/reviews.js";
import { ReviewModalEntries } from "../enums/textfields.js";
import { reviewEditingSession } from "../reviews/edit.js";

@Discord()
@SlashGroup({ name: "review", description: "Reviews commands" })
export class ReviewCommand {

    /**
    * show the add a review modal
    */
    @Slash("add", {defaultMemberPermissions: PermissionFlagsBits.Administrator})
    @SlashGroup("review")
    async add(
       @SlashChoice({ name: "service", value: "service"})
       @SlashChoice({ name: "product", value: "product"})
       @SlashOption("type", { description: "type of review", required: true, type: ApplicationCommandOptionType.String }) type: string,
       interaction: CommandInteraction
    ) {
        if (type != "product" && type != "service") {
            return interaction.reply("Invalid type");
        }

        if (type == "product") {
            return interaction.showModal(new ModalBuilder()
                .setTitle("Add a product review")
                .setCustomId("add_product_review")
                .setComponents(ReviewModalEntries.ADD_PRODUCT.toArray())
            );
        } else {
            return interaction.showModal(new ModalBuilder()
                .setTitle("Add a service review")
                .setCustomId("add_service_review")
                .setComponents(ReviewModalEntries.ADD_SERVICE.toArray())
            );
        }
    }

    /**
    * remove a review
    */
     @Slash("remove", {defaultMemberPermissions: PermissionFlagsBits.Administrator})
     @SlashGroup("review")
     async remove(
        @SlashOption("id", { description: "id of review", required: true, type: ApplicationCommandOptionType.String }) reviewId: string,
        @SlashOption("notify", { description: "notify the user", type: ApplicationCommandOptionType.Boolean }) notify: boolean,
        interaction: CommandInteraction
     ) {
        const review = await AppDataSource.manager.findOneBy(ReviewsEntity, { id: reviewId });
        if (!review) {
            interaction.reply({ content: "Review not found", ephemeral: true });
            return;
        }

        // fetch message and delete it
        const message = await interaction.channel?.messages.fetch(review.discord_message);
        
        if (message) {
            message.delete();
        } else {
            interaction.reply({ content: "Message not found", ephemeral: true });
            return;
        }

        await AppDataSource
            .createQueryBuilder()
            .delete()
            .from(ReviewsEntity)
            .where("id = :id", { id: reviewId })
            .execute();

        if (notify && (review.discord_user != undefined || null)) {
            const user = await interaction.client.users.fetch(review.discord_user!);
            if (user) {
                // create dm with user then send message
                user.createDM().then(channel => {
                    channel.send({ content: `Your review with id: *${reviewId}* has been removed.\nIf you think this is a mistake, please contact an administrator.` });
                }).catch(() => {
                    interaction.reply({ content: "Could not send message to user **but** review was removed.", ephemeral: true });
                });
            }
        }

        interaction.reply({ content: "Review was removed", ephemeral: true });
     }

    /**
    * edit a review
    */
    @Slash("edit", {defaultMemberPermissions: PermissionFlagsBits.Administrator})
    @SlashGroup("review")
    async edit(
       @SlashOption("id", { description: "id of review", required: true, type: ApplicationCommandOptionType.String }) reviewId: string,
       interaction: CommandInteraction
    ) {

        // find review by id
        const review = await AppDataSource.manager.findOneBy(ReviewsEntity, { id: reviewId });

        if (!review) {
            interaction.reply({ content: "Review not found", ephemeral: true });
            return;
        }

        if (review.type != "product" && review.type != "service") {
            return interaction.reply("Found review with invalid type");
        }

        reviewEditingSession.set(interaction.user.id, review.id);

        if (review.type == "product") {
            return interaction.showModal(new ModalBuilder()
                .setTitle("Editing a product review")
                .setCustomId("edit_product_review")
                .setComponents(ReviewModalEntries.EDIT_PRODUCT.toArray())
            );
        } else {
            return interaction.showModal(new ModalBuilder()
                .setTitle("Editing a service review")
                .setCustomId("edit_service_review")
                .setComponents(ReviewModalEntries.EDIT_SERVICE.toArray())
            );
        }
    }
}