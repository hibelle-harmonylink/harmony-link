(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.HarmonyAccess = api;
})(typeof window !== 'undefined' ? window : globalThis, () => {
  'use strict';

  const USER_TYPES = Object.freeze(['student', 'partner']);
  const MEMBERSHIPS = Object.freeze(['free', 'basic', 'premium']);
  const ACTIVE_STATUSES = new Set(['active', 'expiring']);
  const FEATURE_LABELS = Object.freeze({
    community: '커뮤니티',
    learning: '디지털·언어·음악 프로그램',
    basic_benefits: 'BASIC 회원 혜택',
    partner_center: '파트너 센터',
    partner_profile: '파트너 프로필 관리',
    partner_resources: '파트너 전용 자료',
    premium_content: 'PREMIUM 콘텐츠',
    premium_apps: 'PREMIUM 앱',
    ai_shorts: 'AI 쇼츠 생성기'
  });

  const legacyMembership = role => role === 'partner50' ? 'premium' : role === 'partner20' ? 'basic' : 'free';
  const normalizeUser = source => {
    const user = source || {};
    const administrator = user.is_admin === true || user.isAdmin === true || user.role === 'admin';
    let userType = user.user_type || user.userType || user.member_type || user.memberType;
    if (userType === 'general' || userType === 'admin') userType = 'student';
    if (!USER_TYPES.includes(userType)) userType = /^partner/.test(user.role || '') ? 'partner' : 'student';
    let membership = user.membership;
    if (!MEMBERSHIPS.includes(membership)) membership = legacyMembership(user.role);
    return {
      ...user,
      user_type: userType,
      membership,
      account_status: user.account_status || user.status || 'active',
      is_admin: administrator
    };
  };

  const hasFeatureAccess = (source, feature) => {
    const user = normalizeUser(source);
    if (!ACTIVE_STATUSES.has(user.account_status)) return false;
    if (user.is_admin) return true;
    if (feature === 'community' || feature === 'learning') return true;
    if (feature === 'basic_benefits') return user.membership === 'basic' || user.membership === 'premium';
    if (feature === 'partner_center' || feature === 'partner_profile' || feature === 'partner_resources') {
      return user.user_type === 'partner';
    }
    if (feature === 'premium_content' || feature === 'premium_apps' || feature === 'ai_shorts') {
      return user.membership === 'premium';
    }
    return false;
  };

  const canAccessPartnerCenter = user => hasFeatureAccess(user, 'partner_center');
  const canAccessPremiumApps = user => hasFeatureAccess(user, 'premium_apps');
  const getFeatureAccess = user => Object.keys(FEATURE_LABELS).map(feature => ({
    feature,
    label: FEATURE_LABELS[feature],
    allowed: hasFeatureAccess(user, feature)
  }));

  return Object.freeze({
    USER_TYPES,
    MEMBERSHIPS,
    FEATURE_LABELS,
    normalizeUser,
    hasFeatureAccess,
    canAccessPartnerCenter,
    canAccessPremiumApps,
    getFeatureAccess
  });
});
