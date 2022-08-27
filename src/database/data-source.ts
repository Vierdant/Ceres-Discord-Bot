import "reflect-metadata"
import * as dotenv from 'dotenv';
import { DataSource } from "typeorm"
import { TicketsEntity } from "./entity/tickets.js"
import { ReviewsEntity, SupportFeedbackEntity } from "./entity/reviews.js"

dotenv.config();

export const AppDataSource = new DataSource({
    type: "mysql",
    host: (process.env.DATABASE_HOST as string),
    port: 3306,
    username: (process.env.DATABASE_USERNAME as string),
    password: (process.env.DATABASE_PASSWORD as string),
    database: (process.env.DATABASE_NAME as string),
    synchronize: true,
    logging: false,
    entities: [TicketsEntity, ReviewsEntity, SupportFeedbackEntity],
    migrations: [],
    subscribers: [],
})
