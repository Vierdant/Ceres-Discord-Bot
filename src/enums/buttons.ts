import { ButtonBuilder, ButtonStyle } from "discord.js";

// This is not a typical enum class, because they are used to retrive objects that are
// neither numeric or string based, it's using a trick to be used like an enum.
// blame typescript.

export class TicketButtons {
    static readonly CREATE_TICKET  = new TicketButtons('CREATE_TICKET', 
        // Button to open a ticket channel
        new ButtonBuilder()
            .setCustomId("create_ticket")
            .setLabel("Support Ticket")
            .setStyle(ButtonStyle.Secondary));
            
    static readonly CREATE_REQUEST = new TicketButtons('CREATE_REQUEST', 
        // Button to open a request channel
        new ButtonBuilder()
            .setCustomId("create_request")
            .setLabel("Commission Request")
            .setStyle(ButtonStyle.Success));

    static readonly CLAIM = new TicketButtons('CLAIM', 
        // Button to claim a ticket channel
        new ButtonBuilder()
            .setCustomId("claim_ticket")
            .setLabel("Claim")
            .setStyle(ButtonStyle.Primary)
            .setEmoji("✅"));

    static readonly LOCK = new TicketButtons('LOCK', 
        // Button to lock a ticket channel
        new ButtonBuilder()
            .setCustomId("lock_ticket")
            .setLabel("Lock")
            .setStyle(ButtonStyle.Secondary)
            .setEmoji("🔒"));
    
    static readonly UNLOCK = new TicketButtons('UNLOCK', 
        // Button to lock a ticket channel
        new ButtonBuilder()
            .setCustomId("unlock_ticket")
            .setLabel("Unlock")
            .setStyle(ButtonStyle.Secondary)
            .setEmoji("🔓"));

    static readonly CLOSE = new TicketButtons('CLOSE', 
        // Button to close a ticket channel
        new ButtonBuilder()
            .setCustomId("close_ticket")
            .setLabel("Close")
            .setStyle(ButtonStyle.Danger)
            .setEmoji("⚠️"));

    static readonly REVIEW = new TicketButtons('REVIEW', 
        // Button to close a ticket channel
        new ButtonBuilder()
            .setCustomId("review_request")
            .setLabel("Review Our Service")
            .setStyle(ButtonStyle.Secondary)
            .setEmoji("🌟"));
    
    static readonly FEEDBACK = new TicketButtons('FEEDBACK', 
        // Button to close a ticket channel
        new ButtonBuilder()
            .setCustomId("support_feedback")
            .setLabel("Give Us Feedback")
            .setStyle(ButtonStyle.Secondary)
            .setEmoji("🌟"));
  
    // private to disallow creating other instances of this type
    private constructor(private readonly key: string, public readonly value: ButtonBuilder) {
    }
  
    toString() {
        return this.key;
    }
    
    // get the value as in the button
    toValue() {
        return this.value;
    }
}

export class EssentialButtons {
    static readonly VERIFY  = new EssentialButtons('VERIFY', 
        // Button to open a ticket channel
        new ButtonBuilder()
            .setCustomId("verify_server_member")
            .setLabel("Verify")
            .setStyle(ButtonStyle.Success));
  
    // private to disallow creating other instances of this type
    private constructor(private readonly key: string, public readonly value: ButtonBuilder) {
    }
  
    toString() {
        return this.key;
    }
    
    // get the value as in the button
    toValue() {
        return this.value;
    }
}