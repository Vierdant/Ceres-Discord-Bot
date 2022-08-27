import { EmbedBuilder } from "discord.js";

/**
 * Used to generate embeds from templates to shorten code
 * Note that templates use a specific formatting in JSON
 * look in: @see ./templates
 */
export class EmbedTemplate {

    fileName: string
    embed: EmbedBuilder;

    constructor(fileName: string) {
        this.fileName = fileName;
        this.embed = new EmbedBuilder;
    }

    /**
     * Loads the requested template from a JSON
     * @returns EmbedBuilder setup with loaded settings from a JSON file
     */
    public async load(): Promise<EmbedBuilder> {
        const raw = await this.fetchFile()
        const data = raw["default"]
        
        if (data["author"] != null) {
            this.embed.setAuthor({ name: data["author"][0].name, url: data["author"][0].url, iconURL: data["author"][0].iconURL})
        }

        if (data.title != null) {
            this.embed.setTitle(data.title)
        }

        if (data.url != null) {
            this.embed.setURL(data.url)
        }

        if (data.color != null) {
            this.embed.setColor(data.color)
        }

        if (data.thumbnail != null) {
            this.embed.setThumbnail(data.thumbnail)
        }

        if (data.description != null) {
            this.embed.setDescription(data.description)
        }
        
        if (data.image != null) {
            this.embed.setDescription(data.image)
        }
        
        if (data.timestamp != null) {
            this.embed.setTimestamp(data.timestamp == "now" ? Date.now() : parseInt(data.timestamp))
        }

        if (data["footer"] != null) {
            this.embed.setFooter({ text: data["footer"][0].text, iconURL: data["footer"][0].iconURL })
        }

        if (data["fields"] != null) {
            for (let field of data["fields"]) {
                this.embed.addFields({ name: field.name, value: field.value, inline: field.inline })
            }
        }

        return this.embed;
    }

    /**
     * @returns a json body containing information used to generate embed templates
     */
    private async fetchFile(): Promise<any> {
        let data = await import(`./templates/${this.fileName}.json`, {assert: { type: 'json' }});
        //const data = fs.readFileSync(`embeds/templates/${this.fileName}.json`)
        if (data != null) {
            return data;
        }
    }
}
