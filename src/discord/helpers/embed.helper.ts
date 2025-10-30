import { EmbedBuilder, type ColorResolvable } from 'discord.js'
import { Colors } from 'src/config/color.config'

export class EmbedHelper {
  static success(title: string, description?: string): EmbedBuilder {
    return this.createEmbed(`✅ ${title}`, description, Colors.success)
  }

  static error(title: string, description?: string): EmbedBuilder {
    return this.createEmbed(`❌ ${title}`, description, Colors.error)
  }

  static info(title: string, description?: string): EmbedBuilder {
    return this.createEmbed(`🔑 ${title}`, description, Colors.info)
  }

  static warning(title: string, description?: string): EmbedBuilder {
    return this.createEmbed(`⚠️ ${title}`, description, Colors.warning)
  }

  static loading(title: string, description?: string): EmbedBuilder {
    return this.createEmbed(`⏳ ${title}`, description, Colors.warning)
  }

  static custom(
    title: string,
    description?: string,
    color?: ColorResolvable,
  ): EmbedBuilder {
    return this.createEmbed(title, description, color)
  }

  static permissionDenied(description: string): EmbedBuilder {
    return this.error('Permission Denied', description)
  }

  private static createEmbed(
    title: string,
    description?: string,
    color?: ColorResolvable,
  ): EmbedBuilder {
    const embed = new EmbedBuilder().setTitle(title).setTimestamp()

    if (description) {
      embed.setDescription(description)
    }

    if (color) {
      embed.setColor(color)
    }

    return embed
  }

  static field(name: string, value: string, inline = false) {
    return { name, value, inline }
  }

  static inlineFields(data: Record<string, string>) {
    return Object.entries(data).map(([name, value]) =>
      this.field(name, value, true),
    )
  }
}
