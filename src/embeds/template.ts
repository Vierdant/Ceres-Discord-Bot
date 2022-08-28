import { EmbedBuilder } from "discord.js";

/**
 * Used to generate embeds from templates to shorten code
 * Note that templates use a specific formatting in JSON
 * @see ./templates
 */
export class EmbedTemplate {

    fileName: string
    embed: EmbedBuilder;

    constructor(fileName: string) {
        this.fileName = fileName;
        this.embed = new EmbedBuilder;
    }

    /**
     * Loads the requested template from a JSON file
     * @returns EmbedBuilder setup with loaded settings from a JSON file
     */
    public async load(): Promise<EmbedBuilder> {
        const raw = await this.fetchFile()
        const data = raw["default"]
        
        if (data["author"]) {
            this.embed.setAuthor({ name: data["author"][0].name, url: data["author"][0].url, iconURL: data["author"][0].iconURL})
        }

        if (data.title) {
            this.embed.setTitle(data.title)
        }

        if (data.url) {
            this.embed.setURL(data.url)
        }

        if (data.color) {
            this.embed.setColor(data.color)
        }

        if (data.thumbnail) {
            this.embed.setThumbnail(data.thumbnail)
        }

        if (data.description) {
            this.embed.setDescription(data.description)
        }
        
        if (data.image) {
            this.embed.setDescription(data.image)
        }
        
        if (data.timestamp) {
            this.embed.setTimestamp(data.timestamp == "now" ? Date.now() : parseInt(data.timestamp))
        }

        if (data["footer"]) {
            this.embed.setFooter({ text: data["footer"][0].text, iconURL: data["footer"][0].iconURL })
        }

        if (data["fields"]) {
            for (const field of data["fields"]) {
                this.embed.addFields({ name: field.name, value: field.value, inline: field.inline })
            }
        }

        return this.embed;
    }

    /**
     * @returns a json body containing information used to generate embed templates
     */
    private async fetchFile(): Promise<any> {
        const data = await import(`./templates/${this.fileName}.json`, {assert: { type: 'json' }});
        //const data = fs.readFileSync(`embeds/templates/${this.fileName}.json`)
        if (data) {
            return data;
        }
    }
}
