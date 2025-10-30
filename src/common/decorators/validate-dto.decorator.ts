import { plainToInstance } from 'class-transformer';
import { validate, ValidationError } from 'class-validator';

export function ValidateDto(dtoClass: any) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      // Find the DTO parameter (usually the last argument)
      const dtoParamIndex = args.length - 1;
      const dtoData = args[dtoParamIndex];
      const interaction = args[0]?.[0]; // Extract interaction from context

      try {
        // Convert and validate DTO
        const dto = plainToInstance(dtoClass, dtoData);
        const errors = await validate(dto as object);

        if (errors.length > 0) {
          // Format validation errors
          const formattedErrors = errors.reduce((acc, error) => ({
            ...acc,
            [error.property]: Object.values(error.constraints || {}),
          }), {});

          // If we have an interaction, send an error message
          if (interaction?.isCommand?.()) {
            const errorMessage = Object.entries(formattedErrors)
              .map(([field, messages]) => `• **${field}**: ${(messages as string[]).join(', ')}`)
              .join('\n');

            const embed = {
              color: 0xFF0000,
              title: '❌ Validation Error',
              description: 'Please fix the following errors:',
              fields: [{
                name: 'Issues',
                value: errorMessage || 'Unknown validation error',
              }],
              timestamp: new Date().toISOString(),
            };

            if (interaction.deferred) {
              await interaction.editReply({ embeds: [embed] });
            } else if (interaction.replied) {
              await interaction.followUp({ embeds: [embed], ephemeral: true });
            } else {
              await interaction.reply({ embeds: [embed], ephemeral: true });
            }
          }

          // Return early to prevent the original method from executing
          return null;
        }

        // Replace the original DTO with the validated one
        const newArgs = [...args];
        newArgs[dtoParamIndex] = dto;

        // Call the original method with validated DTO
        return originalMethod.apply(this, newArgs);
      } catch (error) {
        // Re-throw the error without logging
        throw error;
      }
    };

    return descriptor;
  };
}
