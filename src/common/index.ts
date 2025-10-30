import * as crypto from 'crypto'

export function randomCode(length: number): string {
  return crypto
    .randomBytes(Math.ceil(length / 2))
    .toString('hex')
    .slice(0, length)
}

export function nameValue<T extends Record<string, any>>(
  result: T[],
  choice: keyof T,
  value: keyof T,
): { name: string; value: string }[] {
  return result.map((r) => ({
    name: String(r[choice]),
    value: String(r[value]),
  }))
}

import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

export async function validateDto<T extends object>(
  dtoClass: new () => T,
  data: any,
  interaction?: any
): Promise<boolean> {
  try {
    // Create DTO instance
    const dto = plainToInstance(dtoClass, data, {
      excludeExtraneousValues: false,
      enableImplicitConversion: false,
    });

    // Validate
    const validationErrors = await validate(dto, {
      whitelist: false,
      forbidNonWhitelisted: false,
      skipMissingProperties: false,
    });

    if (validationErrors.length > 0) {
      // Format errors
      const formattedErrors = validationErrors.reduce((acc, error) => ({
        ...acc,
        [error.property]: Object.values(error.constraints || {})[0],
      }), {});

      // Send error message if interaction provided
      if (interaction?.isCommand?.()) {
        const fields = Object.entries(formattedErrors).map(([field, message]) => ({
          name: `❌ ${field}`,
          value: message,
          inline: false
        }));

        const embed = {
          color: 0xFF0000,
          title: '❌ Validation Error',
          description: 'Please fix the following issues:',
          fields: fields.length > 0 ? fields : [{
            name: 'Error',
            value: 'Unknown validation error',
          }],
          timestamp: new Date().toISOString(),
        };

        try {
          if (interaction.deferred || interaction.replied) {
            await interaction.editReply({ embeds: [embed] });
          } else if (!interaction.deferred && !interaction.replied) {
            await interaction.reply({ embeds: [embed], flags: 64 }); // 64 is the flag for ephemeral
          }
        } catch (error) {
          console.error('Failed to send validation error:', error);
          // If we can't send the error message, we still want to return false
        }
      }

      return false;
    }

    return true;
  } catch (error) {
    console.error('Validation error:', error);
    return false;
  }
}