import { EmbedBuilder, GuildMember, User } from "discord.js";

/**
 * Calculates the rating of a review and returns the rating as a displayable star emoji string.
 */
const getRatingDisplay = (rating: number): string => {
    let ratingDisplay: string = "";

    const diffirance = 5 - rating;
    for (let i = 1; i <= rating; i++) {
        ratingDisplay = ratingDisplay.concat("<:star_fill:1008057472809971803>")
    }
    for (let i = 1; i <= diffirance; i++) {
        ratingDisplay = ratingDisplay.concat("<:star_empty:1008057471337771128>")
    }

    return ratingDisplay;
}

/**
 * Extracts the platform name from a string and returns an object with the platform name and the platform image.
 */
const getPlatform = (platform: string): { name: string, thumbnail: string} => {
    let name: string = "";
    let thumbnail: string = "";

    if (platform.includes("builtbybit")) {
        name = "BuiltByBit";
        thumbnail = "https://cdn.discordapp.com/attachments/1008049815860543589/1013104839057743882/mcmarket.png";
    } else if (platform.includes("mythiccraft")) {
        name = "MythicCraft";
        thumbnail = "https://cdn.discordapp.com/attachments/1008049815860543589/1013104839779172372/mythiccraft.png";
    } else if (platform.includes("polymart")) {
        name = "Polymart";
        thumbnail = "https://cdn.discordapp.com/attachments/1008049815860543589/1013104840362184794/polymart.png";
    }

    return {
        name,
        thumbnail
    };
}

/**
 * Builds an embed for a product review.
 */
export const ProductReviewEmbed = (entityId: string,userprofile: string, product: string, rating: number, review: string): EmbedBuilder => {
    const ratingDisplay = getRatingDisplay(rating);
    const platform = getPlatform(userprofile);

    const embed = new EmbedBuilder()
        .setColor("#7c6ea7")
        .setTitle("Product Review")
        .setDescription(`Thank you for reviewing one of our products on ${platform.name}.`)
        .setThumbnail(platform.thumbnail)
        .setTimestamp(Date.now())
        .setFooter({ text: `id: ${entityId}`, iconURL: "https://cdn.discordapp.com/attachments/1008049815860543589/1008049949436559390/rs_logo.png"})
        .addFields(
            { name: "Customer", value: userprofile, inline: false},
            { name: "Product", value: product, inline: false},
            { name: "Rating", value: ratingDisplay, inline: false},
            { name: "Review", value: review, inline: false}
        )

    return embed;
}

/**
 * Builds an embed for a service review.
 */
export const ServiceReviewEmbed = (member: GuildMember | User | null | undefined, id: string, rating: number, review: string): EmbedBuilder => {
    const ratingDisplay = getRatingDisplay(rating);


    const embed = new EmbedBuilder()
        .setColor("#7c6ea7")
        .setTitle("Commission Review")
        .setDescription("Thank you for your review.")
        .setThumbnail(member ? member.displayAvatarURL() 
        : "https://cdn.discordapp.com/attachments/1008049815860543589/1008049949436559390/rs_logo.png")
        .setTimestamp(Date.now())
        .setFooter({ text: `id: ${id}`, iconURL: "https://cdn.discordapp.com/attachments/1008049815860543589/1008049949436559390/rs_logo.png"})
        .addFields(
            { name: "Customer", value: member ? `<@${member.id}>` : `Anonymous`, inline: false},
            { name: "Rating", value: ratingDisplay, inline: false},
            { name: "Review", value: review, inline: false}
        )

    return embed;
}


/**
 * Builds an embed for a feedback review.
 */
 export const FeedbackReviewEmbed = (member: GuildMember | User | null | undefined, id: string, rating: number, review: string): EmbedBuilder => {
    const ratingDisplay = getRatingDisplay(rating);


    const embed = new EmbedBuilder()
        .setColor("#ff6666")
        .setTitle("Support Feedback")
        .setThumbnail(member!.displayAvatarURL())
        .setTimestamp(Date.now())
        .setFooter({ text: `id: ${id}`, iconURL: "https://cdn.discordapp.com/attachments/1008049815860543589/1008049949436559390/rs_logo.png"})
        .addFields(
            { name: "Customer", value: `<@${member!.id}>`, inline: false},
            { name: "Rating", value: ratingDisplay, inline: false},
            { name: "Review", value: review, inline: false}
        )

    return embed;
}