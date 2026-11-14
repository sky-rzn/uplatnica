import { LOCALES, locale, t } from '../../i18n';
import { SelectField, useFeedback } from '../form';
import { chooseLocale } from '../preferences';

const NO_ISSUES = { errors: {}, warnings: {} };

export function SettingsView() {
  const fb = useFeedback(NO_ISSUES);
  return (
    <section>
      <h1>{t.settings.title}</h1>
      <div class="form">
        <SelectField
          id="settings-locale"
          name="locale"
          label={t.settings.language}
          feedback={fb}
          value={locale()}
          options={LOCALES}
          onChange={chooseLocale}
        />
      </div>
    </section>
  );
}
