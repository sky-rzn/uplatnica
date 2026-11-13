import { describe, expect, it } from 'vitest';
import { renderToString } from 'preact-render-to-string';
import { App } from '../../src/app';

describe('App', () => {
  it('renders the title', () => {
    expect(renderToString(<App />)).toContain('<h1>Uplatnica</h1>');
  });
});
