import type { ComponentChildren } from 'preact';
import { useState } from 'preact/hooks';
import type { Issue, Issues } from '../core/forms/issues';
import { issueText } from './messages';

export interface Feedback {
  errors: Issues;
  warnings: Issues;
}

/** Errors show once a field was left or the form was submitted; warnings show at once. */
export function useFeedback(result: Feedback) {
  const [touched, setTouched] = useState<ReadonlySet<string>>(new Set());
  const [submitted, setSubmitted] = useState(false);
  return {
    touch(name: string) {
      if (!touched.has(name)) setTouched(new Set(touched).add(name));
    },
    submit() {
      setSubmitted(true);
    },
    reset() {
      setTouched(new Set());
      setSubmitted(false);
    },
    error(name: string): Issue | undefined {
      return submitted || touched.has(name) ? result.errors[name] : undefined;
    },
    warning(name: string): Issue | undefined {
      return result.warnings[name];
    },
  };
}

export type FeedbackState = ReturnType<typeof useFeedback>;

interface FieldProps {
  id: string;
  label: string;
  name: string;
  feedback: FeedbackState;
  hint?: ComponentChildren;
  children: (aria: {
    id: string;
    'aria-invalid': boolean;
    'aria-describedby'?: string;
  }) => ComponentChildren;
}

export function Field({
  id,
  label,
  name,
  feedback,
  hint,
  children,
}: FieldProps) {
  const error = feedback.error(name);
  const warning = error ? undefined : feedback.warning(name);
  const issue = error ?? warning;
  const msgId = `${id}-msg`;
  const hintId = `${id}-hint`;
  const describedBy = [issue && msgId, hint !== undefined && hintId]
    .filter(Boolean)
    .join(' ');
  return (
    <div
      class="field"
      onFocusOut={() => {
        feedback.touch(name);
      }}
    >
      <label for={id}>{label}</label>
      {children({
        id,
        'aria-invalid': error !== undefined,
        ...(describedBy ? { 'aria-describedby': describedBy } : {}),
      })}
      {hint !== undefined && (
        <div class="hint" id={hintId}>
          {hint}
        </div>
      )}
      {issue && (
        <p class={error ? 'error' : 'warning'} id={msgId} role="alert">
          {issueText(issue)}
        </p>
      )}
    </div>
  );
}

interface InputProps {
  type?: 'text' | 'month' | 'date';
  inputMode?: 'text' | 'numeric' | 'decimal';
  autoComplete?: string;
  placeholder?: string;
  list?: string;
  maxLength?: number;
}

export function TextField(
  props: Omit<FieldProps, 'children'> & {
    value: string;
    onInput: (value: string) => void;
    input?: InputProps;
    multiline?: boolean;
  },
) {
  const { value, onInput, input, multiline, ...field } = props;
  return (
    <Field {...field}>
      {(aria) =>
        multiline ? (
          <textarea
            {...aria}
            rows={3}
            value={value}
            onInput={(e) => {
              onInput(e.currentTarget.value);
            }}
          />
        ) : (
          <input
            type="text"
            {...input}
            {...aria}
            value={value}
            onInput={(e) => {
              onInput(e.currentTarget.value);
            }}
          />
        )
      }
    </Field>
  );
}

export function SelectField<T extends string>(
  props: Omit<FieldProps, 'children'> & {
    value: T;
    options: readonly { value: T; label: string }[];
    onChange: (value: T) => void;
  },
) {
  const { value, options, onChange, ...field } = props;
  return (
    <Field {...field}>
      {(aria) => (
        <select
          {...aria}
          value={value}
          onChange={(e) => {
            onChange(e.currentTarget.value as T);
          }}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      )}
    </Field>
  );
}

export function CheckField(props: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label class="check">
      <input
        type="checkbox"
        checked={props.checked}
        onChange={(e) => {
          props.onChange(e.currentTarget.checked);
        }}
      />
      {props.label}
    </label>
  );
}

export function hasErrors(result: Feedback): boolean {
  return Object.keys(result.errors).length > 0;
}
