import { Injectable } from '@nestjs/common';
import { AutocompleteInteraction } from 'discord.js';
import { AutocompleteInterceptor } from 'necord';
import { UsersService } from '../../users/users.service';

@Injectable()
export class EmailPrefixAutocompleteInterceptor extends AutocompleteInterceptor {
  private readonly EMAIL_SUFFIX = '@stud.kuet.ac.bd';

  constructor(private readonly usersService: UsersService) {
    super();
  }

  public transformOptions(interaction: AutocompleteInteraction) {
    const focused = interaction.options.getFocused(true);
    const input = focused.value.toString().trim().toLowerCase();

    const prefixOnly = input.split('@')[0];

    if (!prefixOnly) {
      return interaction.respond([
        {
          name: '(start typing your student email prefix)',
          value: '',
        },
      ]);
    }

    if (/^[a-z]{2,}\d{7}$/.test(prefixOnly)) {
      return interaction.respond([
        {
          name: prefixOnly + '@stud.kuet.ac.bd',
          value: prefixOnly + '@stud.kuet.ac.bd',
        },
      ]);
    }

    let response;

    if (/^[a-z]{1,2}$/.test(prefixOnly)) {
      response = [
        {
          name: `${prefixOnly} (your email prefix)`,
          value: prefixOnly,
        },
      ];
    } else if (/^[a-z]+$/.test(prefixOnly)) {
      response = [
        {
          name: `${prefixOnly} (nameRoll)`,
          value: prefixOnly,
        },
      ];
    } else if (/^[a-z]+\d{1,7}$/.test(prefixOnly)) {
      const rollPrefix = prefixOnly.match(/^[a-z]+/)?.[0] || '';
      const numPrefix = prefixOnly.match(/\d+$/)?.[0] || '';

      response = [
        {
          name: `${rollPrefix}${numPrefix || '21'} (Full Roll)`,
          value: prefixOnly,
        },
      ];
    } else {
      response = [
        { name: prefixOnly + ' (invalid format) ', value: prefixOnly },
      ];
    }

    return interaction.respond(response);
  }
}
