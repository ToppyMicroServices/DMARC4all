import test from 'node:test';
import assert from 'node:assert/strict';

import { shouldReloadOnControllerChange } from '../src/pwa.js';

test('controller changes reload only an existing PWA installation once', () => {
	assert.equal(shouldReloadOnControllerChange(false, false), false);
	assert.equal(shouldReloadOnControllerChange(true, false), true);
	assert.equal(shouldReloadOnControllerChange(true, true), false);
});
