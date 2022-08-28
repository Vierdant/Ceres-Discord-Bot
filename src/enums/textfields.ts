import { TextInputBuilder, TextInputStyle, ActionRowBuilder, ModalActionRowComponentBuilder } from "discord.js";

// This is not a typical enum class, because they are used to retrive objects that are
// neither numeric or string based, it's using a trick to be used like an enum.
// blame typescript.

export class TicketModalEntries {
    static readonly SUPPORT_TICKET  = new TicketModalEntries('SUPPORT_TICKET', [
        // Button to open a ticket channel
        new ActionRowBuilder<ModalActionRowComponentBuilder>().setComponents(
            new TextInputBuilder()
            .setCustomId("subject")
            .setLabel("Subject")
            .setPlaceholder("Subject of this ticket")
            .setRequired(true)
            .setMinLength(5)
            .setMaxLength(100)
            .setStyle(TextInputStyle.Short)
        ),

        new ActionRowBuilder<ModalActionRowComponentBuilder>().setComponents(
            new TextInputBuilder()
                .setCustomId("explanation")
                .setLabel("Explanation")
                .setPlaceholder("Explain your concerns")
                .setRequired(true)
                .setMinLength(10)
                .setMaxLength(1000)
                .setStyle(TextInputStyle.Paragraph)
        )
    ])

    static readonly COMMISSION_REQUEST  = new TicketModalEntries('COMMISSION_REQUEST', [
        // Button to open a ticket channel
        new ActionRowBuilder<ModalActionRowComponentBuilder>().setComponents(
            new TextInputBuilder()
            .setCustomId("request")
            .setLabel("Request")
            .setPlaceholder("The request in short")
            .setRequired(true)
            .setMinLength(5)
            .setMaxLength(200)
            .setStyle(TextInputStyle.Short)
        ),

        new ActionRowBuilder<ModalActionRowComponentBuilder>().setComponents(
            new TextInputBuilder()
                .setCustomId("category")
                .setLabel("Category")
                .setPlaceholder("Request category (Pixel Art, Development, Modeling...)")
                .setRequired(true)
                .setMinLength(5)
                .setMaxLength(100)
                .setStyle(TextInputStyle.Short)
        ),

        new ActionRowBuilder<ModalActionRowComponentBuilder>().setComponents(
            new TextInputBuilder()
                .setCustomId("budget")
                .setLabel("Budget")
                .setPlaceholder("Your budget for this request.")
                .setRequired(true)
                .setMinLength(1)
                .setMaxLength(100)
                .setStyle(TextInputStyle.Short)
        ),

        new ActionRowBuilder<ModalActionRowComponentBuilder>().setComponents(
            new TextInputBuilder()
                .setCustomId("explanation")
                .setLabel("Explanation")
                .setPlaceholder("Explain your request a bit more")
                .setRequired(true)
                .setMinLength(10)
                .setMaxLength(3000)
                .setStyle(TextInputStyle.Paragraph)
        )
    ])

    static readonly CLOSE_TICKET  = new TicketModalEntries('CLOSE_TICKET', [
        new ActionRowBuilder<ModalActionRowComponentBuilder>().setComponents(
            new TextInputBuilder()
                .setCustomId("reason")
                .setLabel("Reason")
                .setPlaceholder("why is the ticket being closed")
                .setRequired(true)
                .setMinLength(2)
                .setMaxLength(1000)
                .setStyle(TextInputStyle.Paragraph)
        )
    ])

    static readonly REVIEW  = new TicketModalEntries('REVIEW', [
        new ActionRowBuilder<ModalActionRowComponentBuilder>().setComponents(
            new TextInputBuilder()
                .setCustomId("rating")
                .setLabel("Rating")
                .setPlaceholder("between 1-5 | Anything else will fail interaction.")
                .setRequired(true)
                .setMinLength(1)
                .setMaxLength(1)
                .setStyle(TextInputStyle.Short)
        ),

        new ActionRowBuilder<ModalActionRowComponentBuilder>().setComponents(
            new TextInputBuilder()
                .setCustomId("review")
                .setLabel("Review / Feedback")
                .setPlaceholder("Explain why you're giving this rating.")
                .setRequired(true)
                .setMinLength(1)
                .setMaxLength(2000)
                .setStyle(TextInputStyle.Paragraph)
        )
    ])
        
  
    // private to disallow creating other instances of this type
    private constructor(private readonly key: string, public readonly value: any) {
    }
  
    toString() {
        return this.key;
    }
    
    // get the value as in the button
    toArray() {
        return this.value;
    }
}


export class ReviewModalEntries {
    static readonly ADD_SERVICE  = new ReviewModalEntries('ADD_SERVICE', [
        // Button to open a ticket channel
        new ActionRowBuilder<ModalActionRowComponentBuilder>().setComponents(
            new TextInputBuilder()
            .setCustomId("discorduser")
            .setLabel("Discord User")
            .setPlaceholder("ID of the person who reviewed")
            .setRequired(false)
            .setMinLength(5)
            .setMaxLength(100)
            .setStyle(TextInputStyle.Short)
        ),

        new ActionRowBuilder<ModalActionRowComponentBuilder>().setComponents(
            new TextInputBuilder()
                .setCustomId("rating")
                .setLabel("Rating")
                .setPlaceholder("between 1-5 | Anything else will fail interaction.")
                .setRequired(true)
                .setMinLength(1)
                .setMaxLength(1)
                .setStyle(TextInputStyle.Short)
        ),

        new ActionRowBuilder<ModalActionRowComponentBuilder>().setComponents(
            new TextInputBuilder()
                .setCustomId("review")
                .setLabel("Review / Feedback")
                .setPlaceholder("Review Text.")
                .setRequired(true)
                .setMinLength(1)
                .setMaxLength(2000)
                .setStyle(TextInputStyle.Paragraph)
        )
    ])

    static readonly ADD_PRODUCT  = new ReviewModalEntries('ADD_PRODUCT', [
        // Button to open a ticket channel
        new ActionRowBuilder<ModalActionRowComponentBuilder>().setComponents(
            new TextInputBuilder()
            .setCustomId("product")
            .setLabel("Product")
            .setPlaceholder("Name of the reviewed product")
            .setRequired(true)
            .setMinLength(5)
            .setMaxLength(100)
            .setStyle(TextInputStyle.Short)
        ),

        new ActionRowBuilder<ModalActionRowComponentBuilder>().setComponents(
            new TextInputBuilder()
            .setCustomId("userprofile")
            .setLabel("User Profile")
            .setPlaceholder("Profile link of the user who reviewed")
            .setRequired(true)
            .setMinLength(5)
            .setMaxLength(500)
            .setStyle(TextInputStyle.Short)
        ),

        new ActionRowBuilder<ModalActionRowComponentBuilder>().setComponents(
            new TextInputBuilder()
                .setCustomId("rating")
                .setLabel("Rating")
                .setPlaceholder("between 1-5 | Anything else will fail interaction.")
                .setRequired(true)
                .setMinLength(1)
                .setMaxLength(1)
                .setStyle(TextInputStyle.Short)
        ),

        new ActionRowBuilder<ModalActionRowComponentBuilder>().setComponents(
            new TextInputBuilder()
                .setCustomId("review")
                .setLabel("Review / Feedback")
                .setPlaceholder("Review Text.")
                .setRequired(true)
                .setMinLength(1)
                .setMaxLength(2000)
                .setStyle(TextInputStyle.Paragraph)
        )
    ])

    static readonly EDIT_SERVICE  = new ReviewModalEntries('EDIT_SERVICE', [
        // Button to open a ticket channel
        new ActionRowBuilder<ModalActionRowComponentBuilder>().setComponents(
            new TextInputBuilder()
            .setCustomId("discorduser")
            .setLabel("Discord User")
            .setPlaceholder("ID of the person who reviewed")
            .setRequired(false)
            .setMinLength(5)
            .setMaxLength(100)
            .setStyle(TextInputStyle.Short)
        ),

        new ActionRowBuilder<ModalActionRowComponentBuilder>().setComponents(
            new TextInputBuilder()
                .setCustomId("rating")
                .setLabel("Rating")
                .setPlaceholder("between 1-5 | Anything else will fail interaction.")
                .setRequired(false)
                .setMinLength(1)
                .setMaxLength(1)
                .setStyle(TextInputStyle.Short)
        ),

        new ActionRowBuilder<ModalActionRowComponentBuilder>().setComponents(
            new TextInputBuilder()
                .setCustomId("review")
                .setLabel("Review / Feedback")
                .setPlaceholder("Review Text.")
                .setRequired(false)
                .setMinLength(1)
                .setMaxLength(2000)
                .setStyle(TextInputStyle.Paragraph)
        )
    ])

    static readonly EDIT_PRODUCT  = new ReviewModalEntries('EDIT_PRODUCT', [
        // Button to open a ticket channel
        new ActionRowBuilder<ModalActionRowComponentBuilder>().setComponents(
            new TextInputBuilder()
            .setCustomId("product")
            .setLabel("Product")
            .setPlaceholder("Name of the reviewed product")
            .setRequired(false)
            .setMinLength(5)
            .setMaxLength(100)
            .setStyle(TextInputStyle.Short)
        ),

        new ActionRowBuilder<ModalActionRowComponentBuilder>().setComponents(
            new TextInputBuilder()
            .setCustomId("userprofile")
            .setLabel("User Profile")
            .setPlaceholder("Profile link of the user who reviewed")
            .setRequired(false)
            .setMinLength(5)
            .setMaxLength(500)
            .setStyle(TextInputStyle.Short)
        ),

        new ActionRowBuilder<ModalActionRowComponentBuilder>().setComponents(
            new TextInputBuilder()
                .setCustomId("rating")
                .setLabel("Rating")
                .setPlaceholder("between 1-5 | Anything else will fail interaction.")
                .setRequired(false)
                .setMinLength(1)
                .setMaxLength(1)
                .setStyle(TextInputStyle.Short)
        ),

        new ActionRowBuilder<ModalActionRowComponentBuilder>().setComponents(
            new TextInputBuilder()
                .setCustomId("review")
                .setLabel("Review / Feedback")
                .setPlaceholder("Review Text.")
                .setRequired(false)
                .setMinLength(1)
                .setMaxLength(2000)
                .setStyle(TextInputStyle.Paragraph)
        )
    ])
        
  
    // private to disallow creating other instances of this type
    private constructor(private readonly key: string, public readonly value: any) { 
    }
  
    toString() {
        return this.key;
    }
    
    // get the value as in the button
    toArray() {
        return this.value;
    }
}