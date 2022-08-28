import { ChannelType, ModalSubmitInteraction } from "discord.js";
import { Discord, ModalComponent } from "discordx";
import { nanoid } from "nanoid";
import { ProductReviewEmbed, ServiceReviewEmbed } from "./display.js";
import { InsertReview } from "./db.js";

@Discord()
export class AddReview {

    @ModalComponent("add_service_review")
    async service(interaction: ModalSubmitInteraction) {

        const [discorduser, rating, review] = ["discorduser", "rating", "review"].map((id) =>
            interaction.fields.getTextInputValue(id)
        );

        const ratingValue = parseInt(rating);
        if (isNaN(ratingValue) || ratingValue > 5 || ratingValue < 0) return;

        const id = nanoid(22);

        // if discorduser is defined or not null, then fetch the user from discord
        const discordMemberObject = discorduser ? await interaction.guild?.members.fetch(discorduser) : null;

        const reviewChannel = interaction.client.channels.cache.get(process.env.REVIEW_CHANNEL as string)

        const embed = ServiceReviewEmbed(discordMemberObject, id, ratingValue, review);
        

        if (reviewChannel?.type === ChannelType.GuildText) {
            reviewChannel.send({ embeds: [embed] }).then(message => {
                InsertReview.review(id, "service", discordMemberObject!.user, ratingValue, review, message.id, null, null);
            })
        }

        interaction.reply({ content: "Review was added.", ephemeral: true})
    }




    @ModalComponent("add_product_review")
    async product(interaction: ModalSubmitInteraction) {

        const [product, userprofile, rating, review] = ["product", "userprofile", "rating", "review"].map((id) =>
            interaction.fields.getTextInputValue(id)
        );

        const ratingValue = parseInt(rating);
        if (isNaN(ratingValue) || ratingValue > 5 || ratingValue < 0) return;
        const id = nanoid(22);

        const reviewChannel = interaction.client.channels.cache.get(process.env.REVIEW_CHANNEL as string)

        const embed = ProductReviewEmbed(id, userprofile, product, ratingValue, review);
        

        if (reviewChannel?.type === ChannelType.GuildText) {
            reviewChannel.send({ embeds: [embed] }).then(message => {
                InsertReview.review(id, "product", null, ratingValue, review, message.id, userprofile, product);
            })
        }

        interaction.reply({ content: "Review was added.", ephemeral: true})
    }
}
