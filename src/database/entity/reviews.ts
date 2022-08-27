import {Entity, Column, PrimaryGeneratedColumn, PrimaryColumn} from "typeorm";

@Entity({ name: "Service_Reviews"} )
export class ReviewsEntity {
    @PrimaryColumn('varchar', { length: 22 })
    id!: string;

    @Column("text")
    // type of review, product | service
    type!: string;

    @Column("text", { nullable: true, default: null})
    // product purchased
    product!: string | null;

    @Column("text", { nullable: true, default: null})
    // discord message of the review
    discord_message!: string;

    @Column("text", { nullable: true, default: null})
    // id of the user who rated
    discord_user!: string | null;

    @Column("text", { nullable: true, default: null})
    // id of the user who rated
    profile_link!: string | null;

    @Column("int")
    // rating value
    rating!: number;

    @Column("longtext")
    // the review
    review!: string;
}

@Entity({ name: "Support_Feedback"} )
export class SupportFeedbackEntity {
    @PrimaryColumn('varchar', { length: 22 })
    id!: string;

    @Column("text", { nullable: true, default: null})
    // id of the user who rated
    discord_user!: string;

    @Column("int")
    // rating value
    rating!: number;

    @Column("longtext")
    // the review
    review!: string;
}