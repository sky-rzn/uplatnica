import type { Profile, Section } from '../core/model';
import { href } from './router';

export function SetupNotice(props: {
  profiles: readonly Profile[];
  sections: readonly Section[];
}) {
  return (
    <div class="card notice">
      <p>Pre prvog računa potrebni su:</p>
      <ul>
        {props.profiles.length === 0 && (
          <li>
            <a href={href({ name: 'profiles' })}>platilac</a> - ko plaća;
          </li>
        )}
        {props.sections.length === 0 && (
          <li>
            <a href={href({ name: 'sections' })}>odeljak</a> - grupa računa, na
            primer „Stan“.
          </li>
        )}
      </ul>
    </div>
  );
}
