'use strict';

const assert = require('node:assert/strict');
const access = require('../access-control.js');

const cases = [
  ['free student', { user_type: 'student', membership: 'free' }, false, false],
  ['basic student', { user_type: 'student', membership: 'basic' }, false, false],
  ['premium student', { user_type: 'student', membership: 'premium' }, false, true],
  ['free partner', { user_type: 'partner', membership: 'free' }, true, false],
  ['basic partner', { user_type: 'partner', membership: 'basic' }, true, false],
  ['premium partner', { user_type: 'partner', membership: 'premium' }, true, true]
];

for (const [name, user, partnerCenter, premiumApps] of cases) {
  const activeUser = { ...user, account_status: 'active' };
  assert.equal(access.canAccessPartnerCenter(activeUser), partnerCenter, `${name}: partner center`);
  assert.equal(access.canAccessPremiumApps(activeUser), premiumApps, `${name}: premium apps`);
  assert.equal(access.hasFeatureAccess(activeUser, 'ai_shorts'), premiumApps, `${name}: AI shorts`);
}

assert.equal(access.canAccessPartnerCenter({ user_type: 'partner', membership: 'premium', account_status: 'suspended' }), false);
assert.equal(access.canAccessPremiumApps({ user_type: 'student', membership: 'premium', account_status: 'expired' }), false);
assert.equal(access.hasFeatureAccess({ role: 'admin', account_status: 'active' }, 'ai_shorts'), true);
assert.deepEqual(
  (({ user_type, membership }) => ({ user_type, membership }))(access.normalizeUser({ member_type: 'general', role: 'member' })),
  { user_type: 'student', membership: 'free' }
);
assert.equal(access.normalizeUser({ member_type: 'partner', role: 'partner20' }).membership, 'basic');
assert.equal(access.normalizeUser({ member_type: 'partner', role: 'partner50' }).membership, 'premium');
console.log('All 6 user type/membership combinations passed.');
