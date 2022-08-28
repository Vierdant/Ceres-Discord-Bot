import {Entity, Column, PrimaryColumn} from "typeorm";

@Entity({ name: "Discord_Tickets"} )
export class TicketsEntity {
    
    @PrimaryColumn("varchar", { length: 100 })
    // id of the channel
    channel!: string;

    @Column("text")
    // name of the ticket
    name!: string;

    @Column("text")
    // type of the ticket: ticket | request
    type!: string;
    
    @Column("text")
    // id of the user
    user!: string;
    
    @Column("text", { nullable: true, default: null})
    // id of the handler
    handler!: string | null;
    
    @Column("longtext", {default: "[]"})
    // viewer list
    viewers!: string;

    @Column("text", {nullable: true, default: null})
    // id of the header message
    header!: string;
    
    @Column("text", { default: "OPEN"})
    // status of ticket
    status!: string;
}