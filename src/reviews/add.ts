import { ChannelType, EmbedBuilder, ModalSubmitInteraction } from "discord.js";
import { Discord, ModalComponent } from "discordx";
import { nanoid } from "nanoid";
import { InsertReview } from "./insert.js";

@Discord()
export class Add {

    @ModalComponent("add_service_review")
    async service(interaction: ModalSubmitInteraction) {
        let ratingDisplay: string = "";

        const [discorduser, rating, review] = ["discorduser", "rating", "review"].map((id) =>
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

        // if discorduser is defined or not null, then fetch the user from discord
        const discorduserObject = discorduser ? await interaction.guild?.members.fetch(discorduser) : null;
        
        const reviewChannel = interaction.client.channels.cache.get(process.env.REVIEW_CHANNEL as string)

        const embed = new EmbedBuilder()
            .setColor("#7c6ea7")
            .setTitle("Commission Review")
            .setDescription("Thank you for your review.")
            .setThumbnail(discorduser ? discorduserObject!.displayAvatarURL() 
            : "https://cdn.discordapp.com/attachments/1008049815860543589/1008049949436559390/rs_logo.png")
            .setTimestamp(Date.now())
            .setFooter({ text: `id: ${id}`, iconURL: "https://cdn.discordapp.com/attachments/1008049815860543589/1008049949436559390/rs_logo.png"})
            .addFields(
                { name: "Customer", value: discorduser ? `<@${discorduserObject!.id}>` : `Anonymous`, inline: false},
                { name: "Rating", value: ratingDisplay, inline: false},
                { name: "Review", value: review, inline: false}
            )
        

        if (reviewChannel?.type === ChannelType.GuildText) {
            reviewChannel.send({ embeds: [embed] }).then(message => {
                InsertReview.review(id, "service", discorduserObject!.user, ratingValue, review, message.id, null, null);
            })
        }

        interaction.reply({ content: "Review was added.", ephemeral: true})
    }




    @ModalComponent("add_product_review")
    async product(interaction: ModalSubmitInteraction) {
        let ratingDisplay: string = "";

        const [product, userprofile, rating, review] = ["product", "userprofile", "rating", "review"].map((id) =>
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
        
        let thumbnail = "https://cdn.discordapp.com/attachments/1008049815860543589/1008049949436559390/rs_logo.png";
        let platform = "";

        // if userprofile includes builtbybit, then use the builtbybit logo or else if userprofile includes mythiccraft then use the mythiccraft logo or else if userprofile includes polymart then use the polymart logo
        if (userprofile.includes("builtbybit")) {
            platform = "BuiltByBit";
            thumbnail = "https://cdn.discordapp.com/attachments/1008049815860543589/1013104839057743882/mcmarket.png";
        } else if (userprofile.includes("mythiccraft")) {
            platform = "MythicCraft";
            thumbnail = "https://cdn.discordapp.com/attachments/1008049815860543589/1013104839779172372/mythiccraft.png";
        } else if (userprofile.includes("polymart")) {
            platform = "Polymart";
            thumbnail = "https://cdn.discordapp.com/attachments/1008049815860543589/1013104840362184794/polymart.png";
        }

        const reviewChannel = interaction.client.channels.cache.get(process.env.REVIEW_CHANNEL as string)

        const embed = new EmbedBuilder()
            .setColor("#7c6ea7")
            .setTitle("Product Review")
            .setDescription(`Thank you for reviewing one of our products on ${platform}.`)
            .setThumbnail(thumbnail)
            .setTimestamp(Date.now())
            .setFooter({ text: `id: ${id}`, iconURL: "https://cdn.discordapp.com/attachments/1008049815860543589/1008049949436559390/rs_logo.png"})
            .addFields(
                { name: "Customer", value: userprofile, inline: false},
                { name: "Product", value: product, inline: false},
                { name: "Rating", value: ratingDisplay, inline: false},
                { name: "Review", value: review, inline: false}
            )
        

        if (reviewChannel?.type === ChannelType.GuildText) {
            reviewChannel.send({ embeds: [embed] }).then(message => {
                InsertReview.review(id, "product", null, ratingValue, review, message.id, userprofile, product);
            })
        }

        interaction.reply({ content: "Review was added.", ephemeral: true})
    }
}
