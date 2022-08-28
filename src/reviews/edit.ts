import { ChannelType, ModalSubmitInteraction } from "discord.js";
import { Discord, ModalComponent } from "discordx";
import { AppDataSource } from "../database/data-source.js";
import { ReviewsEntity } from "../database/entity/reviews.js";
import { ProductReviewEmbed, ServiceReviewEmbed } from "./display.js";

@Discord()
export class EditReview {

    @ModalComponent("edit_service_review")
    async service(interaction: ModalSubmitInteraction) {

        const editingId = reviewEditingSession.get(interaction.user.id);

        if (!editingId) {
            interaction.reply({ content: "You are not currently editing a review.", ephemeral: true})
            return;
        }

        // get review by id
        const reviewEntity = await AppDataSource.manager.findOneBy(ReviewsEntity, { id: editingId });

        let [discorduser, rating, review] = ["discorduser", "rating", "review"].map((id) =>
            interaction.fields.getTextInputValue(id)
        );

        discorduser = discorduser ? discorduser : reviewEntity!.discord_user!;
        rating = rating ? rating : reviewEntity!.rating.toString();
        review = review ? review : reviewEntity!.review;

        const ratingValue = parseInt(rating);
        if (isNaN(ratingValue) || ratingValue > 5 || ratingValue < 0) return;

        // if discorduser is defined or not null, then fetch the user from discord
        const discordMemberObject = discorduser ? await interaction.guild?.members.fetch(discorduser) : null;
        
        const reviewChannel = interaction.client.channels.cache.get(process.env.REVIEW_CHANNEL as string)

        const embed = ServiceReviewEmbed(discordMemberObject, reviewEntity!.id, ratingValue, review);
        

        if (reviewChannel?.type === ChannelType.GuildText) {
            // fetch message from the review channel then edit it
            const message = await reviewChannel?.messages.fetch(reviewEntity!.discord_message!);
            if (message) {
                await message.edit({ embeds: [embed]});
            }
        }

        interaction.reply({ content: "Review was edited.", ephemeral: true})

        // update database
        AppDataSource
            .createQueryBuilder()
            .update(ReviewsEntity)
            .set({ discord_user: discorduser, rating: ratingValue, review: review })
            .where("id = :id", { id: editingId })
            .execute()

        reviewEditingSession.delete(interaction.user.id);
    }




    @ModalComponent("edit_product_review")
    async product(interaction: ModalSubmitInteraction) {
        
        const editingId = reviewEditingSession.get(interaction.user.id);

        if (!editingId) {
            interaction.reply({ content: "You are not currently editing a review.", ephemeral: true})
            return;
        }

        // get review by id
        const reviewEntity = await AppDataSource.manager.findOneBy(ReviewsEntity, { id: editingId });

        let [product, userprofile, rating, review] = ["product", "userprofile", "rating", "review"].map((id) =>
            interaction.fields.getTextInputValue(id)
        );
        
        product = product ? product : reviewEntity!.product!;
        userprofile = userprofile ? userprofile : reviewEntity!.profile_link!;
        rating = rating ? rating : reviewEntity!.rating.toString();
        review = review ? review : reviewEntity!.review;

        const ratingValue = parseInt(rating);
        if (isNaN(ratingValue) || ratingValue > 5 || ratingValue < 0) return;

        const reviewChannel = interaction.client.channels.cache.get(process.env.REVIEW_CHANNEL as string)

        const embed = ProductReviewEmbed(product, userprofile, product, ratingValue, review);

        if (reviewChannel?.type === ChannelType.GuildText) {
            // fetch message from the review channel then edit it
            const message = await reviewChannel?.messages.fetch(reviewEntity!.discord_message!);
            if (message) {
                await message.edit({ embeds: [embed]});
            }
        }

        interaction.reply({ content: "Review was added.", ephemeral: true})

        // update database
        AppDataSource
            .createQueryBuilder()
            .update(ReviewsEntity)
            .set({ product: product, profile_link: userprofile, rating: ratingValue, review: review })
            .where("id = :id", { id: editingId })
            .execute()
        
        reviewEditingSession.delete(interaction.user.id);
    }
}

export const reviewEditingSession = new Map<string, string>();
