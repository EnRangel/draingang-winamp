import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

/*
 * Remove each rendered component after its test. This prevents one test's
 * buttons or text from leaking into the next test.
 */
afterEach(() => {
  cleanup();
});
