import { ActionRowBuilder, ButtonInteraction, ChannelType, EmbedBuilder, MessageActionRowComponentBuilder, ModalBuilder, ModalSubmitInteraction } from "discord.js";
import { Discord, ButtonComponent, ModalComponent } from "discordx";
import { nanoid } from "nanoid";
import { TicketButtons } from "../enums/buttons.js";
import { TicketModalEntries } from "../enums/textfields.js";
import { InsertReview } from "../reviews/insert.js";

@Discord()
export class ReviewService {

    @ButtonComponent("review_request")
    async display(interaction: ButtonInteraction) {
        const modal = new ModalBuilder()
            .setTitle("Review our service")
            .setCustomId("review_request_dm")
            .setComponents(TicketModalEntries.REVIEW.toArray());

          
        const reviewButton: ActionRowBuilder<MessageActionRowComponentBuilder> 
        = new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents( 
            TicketButtons.REVIEW.toValue()
        );
        
        await interaction.user.createDM().then(channel => {
            channel.messages.fetch(interaction.message.id).then(message => {
                const embeds = interaction.message.embeds;
                
                message.edit({embeds: [embeds[0]], components: []});

                setTimeout( () => { 
                    message.edit({embeds: [embeds[0]], components: [reviewButton]});
                 }, 60000)
            }) 
        })

        await interaction.showModal(modal); 
    }


    @ModalComponent("review_request_dm")
    async create(interaction: ModalSubmitInteraction) {
        let ratingDisplay: string = "";

        const [rating, review] = ["rating", "review"].map((id) =>
            interaction.fields.getTextInputValue(id)
        );

        const ratingValue = parseInt(rating);
        if (isNaN(ratingValue) || ratingValue > 5 || ratingValue < 0) return;


        const diffirance = 5 - ratingValue;
        for (let i = 1; i <= ratingValue; i++) {
            ratingDisplay = ratingDisplay.concat("<:star_fill:1008057472809971803>")
        }
        for (let i = 1; i <= diffirance; i++) {
            ratingDisplay = ratingDisplay.concat("<:star_empty:1008057471337771128>")
        }

        const id = nanoid(22);
        
        const reviewChannel = interaction.client.channels.cache.get(process.env.REVIEW_CHANNEL as string)

        const embed = new EmbedBuilder()
            .setColor("#7c6ea7")
            .setTitle("Commission Review")
            .setDescription("Thank you for your review.")
            .setThumbnail(interaction.user.displayAvatarURL())
            .setTimestamp(Date.now())
            .setFooter({ text: `id: ${id}`, iconURL: "https://cdn.discordapp.com/attachments/1008049815860543589/1008049949436559390/rs_logo.png"})
            .addFields(
                { name: "Customer", value: `<@${interaction.user.id}>`, inline: false},
                { name: "Rating", value: ratingDisplay, inline: false},
                { name: "Review", value: review, inline: false}
            )
        

        if (reviewChannel?.type === ChannelType.GuildText) {
            reviewChannel.send({ embeds: [embed] }).then(message => {
                InsertReview.review(id, "service", interaction.user, ratingValue, review, message.id, null, null);
            })
        }

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

          
        const reviewButton: ActionRowBuilder<MessageActionRowComponentBuilder> = new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents( 
            TicketButtons.FEEDBACK.toValue()
        );
        
        await interaction.user.createDM().then(channel => {
            channel.messages.fetch(interaction.message.id).then(message => {
                const embeds = interaction.message.embeds;
                
                message.edit({embeds: [embeds[0]], components: []});

                setTimeout( () => { 
                    message.edit({embeds: [embeds[0]], components: [reviewButton]});
                 }, 60000)
            }) 
        })

        await interaction.showModal(modal); 
    }


    @ModalComponent("support_feedback_dm")
    async create(interaction: ModalSubmitInteraction) {
        let ratingDisplay: string = "";

        const [rating, review] = ["rating", "review"].map((id) =>
            interaction.fields.getTextInputValue(id)
        );

        const ratingValue = parseInt(rating);
        if (isNaN(ratingValue) || ratingValue > 5 || ratingValue < 0) return;


        const diffirance = 5 - ratingValue;
        for (let i = 1; i <= ratingValue; i++) {
            ratingDisplay = ratingDisplay.concat("<:star_fill:1008057472809971803>")
        }
        for (let i = 1; i <= diffirance; i++) {
            ratingDisplay = ratingDisplay.concat("<:star_empty:1008057471337771128>")
        }


        const feedbackData = await InsertReview.feedback(nanoid(22), interaction.user, ratingValue, review);
        
        const reviewChannel = interaction.client.channels.cache.get(process.env.SUPPORT_FEEDBACK_CHANNEL as string)

        const embed = new EmbedBuilder()
            .setColor("#ff6666")
            .setTitle("Support Feedback")
            .setThumbnail(interaction.user.displayAvatarURL())
            .setTimestamp(Date.now())
            .setFooter({ text: `id: ${feedbackData.id}`, iconURL: "https://cdn.discordapp.com/attachments/1008049815860543589/1008049949436559390/rs_logo.png"})
            .addFields(
                { name: "Customer", value: `<@${interaction.user.id}>`, inline: false},
                { name: "Rating", value: ratingDisplay, inline: false},
                { name: "Review", value: review, inline: false}
            )
        

        if (reviewChannel?.type === ChannelType.GuildText) {
            reviewChannel.send({ embeds: [embed] })
        }

        interaction.reply({ content: "Thank you for your review!", ephemeral: true})
    }

}