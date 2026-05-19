import { describe, it, expect, vi } from 'vitest';
import { isProfileWriteBlocked, getUserMetaString, createFallbackProfile } from '../utils';

// ─── isProfileWriteBlocked ────────────────────────────────────────────────────

describe('isProfileWriteBlocked', () => {
  it('returns false for null', () => {
    expect(isProfileWriteBlocked(null)).toBe(false);
  });

  it('returns false for undefined', () => {
    expect(isProfileWriteBlocked(undefined)).toBe(false);
  });

  it('returns false for an unrelated error code', () => {
    expect(isProfileWriteBlocked({ code: '23505', message: 'duplicate key' })).toBe(false);
  });

  it('returns true for code 42501', () => {
    expect(isProfileWriteBlocked({ code: '42501', message: 'permission denied' })).toBe(true);
  });

  it('returns true for code 42P01', () => {
    expect(isProfileWriteBlocked({ code: '42P01', message: 'undefined table' })).toBe(true);
  });

  it('returns true for code PGRST116', () => {
    expect(isProfileWriteBlocked({ code: 'PGRST116', message: 'some msg' })).toBe(true);
  });

  it('returns true when message contains "row-level security"', () => {
    expect(isProfileWriteBlocked({ code: '0', message: 'Row-Level Security policy violation' })).toBe(true);
  });

  it('returns true when message contains "relation \"profiles\" does not exist"', () => {
    expect(isProfileWriteBlocked({ code: '0', message: 'relation "profiles" does not exist' })).toBe(true);
  });

  it('returns true when message contains "permission denied"', () => {
    expect(isProfileWriteBlocked({ code: '0', message: 'Permission Denied for table profiles' })).toBe(true);
  });

  it('returns false for a non-object error', () => {
    expect(isProfileWriteBlocked('some string error')).toBe(false);
  });

  it('returns false for numeric error', () => {
    expect(isProfileWriteBlocked(42)).toBe(false);
  });
});

// ─── getUserMetaString ────────────────────────────────────────────────────────

describe('getUserMetaString', () => {
  const baseUser = { id: 'u1', email: 'john.doe@example.com', user_metadata: {} };

  it('returns the metadata "name" if present and non-empty', () => {
    const user = { ...baseUser, user_metadata: { name: 'Alice' } };
    expect(getUserMetaString(user as any, 'name', 'Fallback')).toBe('Alice');
  });

  it('trims whitespace from the metadata value', () => {
    const user = { ...baseUser, user_metadata: { name: '  Bob  ' } };
    expect(getUserMetaString(user as any, 'name', 'Fallback')).toBe('Bob');
  });

  it('falls back to email prefix when name metadata is missing', () => {
    const user = { ...baseUser, user_metadata: {} };
    expect(getUserMetaString(user as any, 'name', 'Scholar')).toBe('john.doe');
  });

  it('falls back to email prefix when name metadata is only whitespace', () => {
    const user = { ...baseUser, user_metadata: { name: '   ' } };
    expect(getUserMetaString(user as any, 'name', 'Scholar')).toBe('john.doe');
  });

  it('falls back to the given fallback when email is absent and name metadata is missing', () => {
    const user = { id: 'u1', email: undefined, user_metadata: {} };
    expect(getUserMetaString(user as any, 'name', 'Scholar')).toBe('Scholar');
  });

  it('returns the metadata "faculty" if present and non-empty', () => {
    const user = { ...baseUser, user_metadata: { faculty: 'BCA' } };
    expect(getUserMetaString(user as any, 'faculty', 'Unknown')).toBe('BCA');
  });

  it('returns the fallback for "faculty" when metadata is missing', () => {
    const user = { ...baseUser, user_metadata: {} };
    expect(getUserMetaString(user as any, 'faculty', 'Unknown')).toBe('Unknown');
  });

  it('returns the fallback for "faculty" when metadata is only whitespace', () => {
    const user = { ...baseUser, user_metadata: { faculty: '   ' } };
    expect(getUserMetaString(user as any, 'faculty', 'Unknown')).toBe('Unknown');
  });

  it('does NOT use email prefix as fallback for "faculty"', () => {
    const user = { ...baseUser, user_metadata: {} };
    expect(getUserMetaString(user as any, 'faculty', 'Unknown')).toBe('Unknown');
  });
});

// ─── createFallbackProfile ────────────────────────────────────────────────────

describe('createFallbackProfile', () => {
  it('creates a profile with id from the user', () => {
    const user = { id: 'abc-123', email: 'user@example.com', user_metadata: { name: 'Carol', faculty: 'BBS' } };
    const profile = createFallbackProfile(user as any);
    expect(profile.id).toBe('abc-123');
  });

  it('creates a profile with role "scholar"', () => {
    const user = { id: 'u1', email: 'user@example.com', user_metadata: {} };
    const profile = createFallbackProfile(user as any);
    expect(profile.role).toBe('scholar');
  });

  it('uses name from user_metadata when available', () => {
    const user = { id: 'u1', email: 'user@example.com', user_metadata: { name: 'Dave', faculty: 'BICTE' } };
    const profile = createFallbackProfile(user as any);
    expect(profile.name).toBe('Dave');
  });

  it('uses email prefix as name when name metadata is absent', () => {
    const user = { id: 'u1', email: 'dave.smith@college.edu', user_metadata: {} };
    const profile = createFallbackProfile(user as any);
    expect(profile.name).toBe('dave.smith');
  });

  it('uses "Scholar" as name when email is absent and metadata is absent', () => {
    const user = { id: 'u1', email: undefined, user_metadata: {} };
    const profile = createFallbackProfile(user as any);
    expect(profile.name).toBe('Scholar');
  });

  it('uses faculty from user_metadata when available', () => {
    const user = { id: 'u1', email: 'user@example.com', user_metadata: { faculty: 'BSW' } };
    const profile = createFallbackProfile(user as any);
    expect(profile.faculty).toBe('BSW');
  });

  it('uses "Unknown" as faculty when metadata is absent', () => {
    const user = { id: 'u1', email: 'user@example.com', user_metadata: {} };
    const profile = createFallbackProfile(user as any);
    expect(profile.faculty).toBe('Unknown');
  });

  it('sets created_at to a valid ISO date string', () => {
    const user = { id: 'u1', email: 'user@example.com', user_metadata: {} };
    const before = new Date().toISOString();
    const profile = createFallbackProfile(user as any);
    const after = new Date().toISOString();
    expect(profile.created_at >= before).toBe(true);
    expect(profile.created_at <= after).toBe(true);
  });
});
