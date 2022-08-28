import { ActionRowBuilder, ButtonInteraction, ChannelType, EmbedBuilder, MessageActionRowComponentBuilder, ModalBuilder, ModalSubmitInteraction, StringMappedInteractionTypes } from "discord.js";
import { Discord, ButtonComponent, ModalComponent } from "discordx";
import { nanoid } from "nanoid";
import { TicketButtons } from "../enums/buttons.js";
import { TicketModalEntries } from "../enums/textfields.js";
import { FeedbackReviewEmbed, ServiceReviewEmbed } from "../reviews/display.js";
import { InsertReview } from "../reviews/db.js";

const ReviewWritingSession = new Map<string, string>(); 
@Discord()
export class ReviewService {

    @ButtonComponent("review_request")
    async display(interaction: ButtonInteraction) {
        const modal = new ModalBuilder()
            .setTitle("Review our service")
            .setCustomId("review_request_dm")
            .setComponents(TicketModalEntries.REVIEW.toArray());

        ReviewWritingSession.set(interaction.user.id, interaction.message.id);

        await interaction.showModal(modal); 
    }


    @ModalComponent("review_request_dm")
    async create(interaction: ModalSubmitInteraction) {

        const [rating, review] = ["rating", "review"].map((id) =>
            interaction.fields.getTextInputValue(id)
        );

        const ratingValue = parseInt(rating);
        if (isNaN(ratingValue) || ratingValue > 5 || ratingValue < 0) return;

        const id = nanoid(22);
        
        const reviewChannel = interaction.client.channels.cache.get(process.env.REVIEW_CHANNEL as string)

        const embed = ServiceReviewEmbed(interaction.user, id, ratingValue, review);
        

        if (reviewChannel?.type === ChannelType.GuildText) {
            reviewChannel.send({ embeds: [embed] }).then(message => {
                InsertReview.review(id, "service", interaction.user, ratingValue, review, message.id, null, null);
            })
        }

        const messageId = ReviewWritingSession.get(interaction.user.id);

        await interaction.user.createDM().then(channel => {
            channel.messages.fetch(messageId!).then(message => {
                const embeds = message.embeds;
                
                message.edit({embeds: [embeds[0]], components: []});
            }) 
        });

        interaction.reply({ content: "Thank you for your review!", ephemeral: true})
    }

}


@Discord()
export class SupportFeedback {

    @ButtonComponent("support_feedback")
    async display(interaction: ButtonInteraction) {
        const modal = new ModalBuilder()
            .setTitle("Support Feedback")
            .setCustomId("support_feedback_dm")
            .setComponents(TicketModalEntries.REVIEW.toArray());

          
        ReviewWritingSession.set(interaction.user.id, interaction.message.id);

        await interaction.showModal(modal); 
    }


    @ModalComponent("support_feedback_dm")
    async create(interaction: ModalSubmitInteraction) {

        const [rating, review] = ["rating", "review"].map((id) =>
            interaction.fields.getTextInputValue(id)
        );

        const ratingValue = parseInt(rating);
        if (isNaN(ratingValue) || ratingValue > 5 || ratingValue < 0) return;

        const feedbackData = await InsertReview.feedback(nanoid(22), interaction.user, ratingValue, review);
        
        const reviewChannel = interaction.client.channels.cache.get(process.env.SUPPORT_FEEDBACK_CHANNEL as string)

        const embed = FeedbackReviewEmbed(interaction.user, feedbackData.id, ratingValue, review);
        
        const messageId = ReviewWritingSession.get(interaction.user.id);

        await interaction.user.createDM().then(channel => {
            channel.messages.fetch(messageId!).then(message => {
                const embeds = message.embeds;
                
                message.edit({embeds: [embeds[0]], components: []});
            }) 
        });

        if (reviewChannel?.type === ChannelType.GuildText) {
            reviewChannel.send({ embeds: [embed] })
        }

        interaction.reply({ content: "Thank you for your review!", ephemeral: true})
    }

}