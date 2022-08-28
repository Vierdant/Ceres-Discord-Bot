import { User } from "discord.js";
import { AppDataSource } from "../database/data-source.js";
import { ReviewsEntity, SupportFeedbackEntity } from "../database/entity/reviews.js";

export class InsertReview {

    static async review(id: string, type: string, user: User | null, rating: number, review: string, message: string, profile_link: string | null, product: string | null): Promise<ReviewsEntity> {
        const reviewEntry = new ReviewsEntity();
        reviewEntry.id = id;
        reviewEntry.type = type;
        reviewEntry.discord_user = user ? user.id : null;
        reviewEntry.product = product;
        reviewEntry.profile_link = profile_link;
        reviewEntry.rating = rating;
        reviewEntry.review = review;
        reviewEntry.discord_message = message;

        return AppDataSource.manager.save(reviewEntry)
    }

    static async feedback(id: string, user: User, rating: number, review: string): Promise<SupportFeedbackEntity> {
        const feedbackEntry = new SupportFeedbackEntity();
        feedbackEntry.id = id;
        feedbackEntry.discord_user = user.id;
        feedbackEntry.rating = rating;
        feedbackEntry.review = review;

        return AppDataSource.manager.save(feedbackEntry)
    }
}