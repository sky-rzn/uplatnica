import type { Profile, Section } from '../core/model';
import { t } from '../i18n';
import { href } from './router';

export function SetupNotice(props: {
  profiles: readonly Profile[];
  sections: readonly Section[];
}) {
  return (
    <div class="card notice">
      <p>{t.setup.lead}</p>
      <ul>
        {props.profiles.length === 0 && (
          <li>
            {t.setup.payer((text) => (
              <a href={href({ name: 'profiles' })}>{text}</a>
            ))}
          </li>
        )}
        {props.sections.length === 0 && (
          <li>
            {t.setup.section((text) => (
              <a href={href({ name: 'sections' })}>{text}</a>
            ))}
          </li>
        )}
      </ul>
    </div>
  );
}
