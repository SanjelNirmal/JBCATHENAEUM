import { describe, it, expect, beforeEach } from 'vitest';
import { getCookie, setCookie } from '../CookieConsent';

describe('getCookie', () => {
  beforeEach(() => {
    // Clear cookies before each test
    document.cookie.split(';').forEach((c) => {
      const [name] = c.split('=');
      document.cookie = `${name.trim()}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/`;
    });
  });

  it('returns null when the cookie does not exist', () => {
    expect(getCookie('nonexistent')).toBeNull();
  });

  it('returns null for empty cookie store', () => {
    expect(getCookie('anything')).toBeNull();
  });

  it('returns the value of an existing cookie', () => {
    document.cookie = 'testName=Alice; path=/';
    expect(getCookie('testName')).toBe('Alice');
  });

  it('returns the correct cookie when multiple cookies are set', () => {
    document.cookie = 'first=foo; path=/';
    document.cookie = 'second=bar; path=/';
    document.cookie = 'third=baz; path=/';
    expect(getCookie('second')).toBe('bar');
    expect(getCookie('first')).toBe('foo');
    expect(getCookie('third')).toBe('baz');
  });

  it('returns null for a name that is a prefix of an existing cookie name', () => {
    document.cookie = 'userName=Alice; path=/';
    expect(getCookie('user')).toBeNull();
  });

  it('returns an empty string for a cookie set to empty value', () => {
    document.cookie = 'empty=; path=/';
    expect(getCookie('empty')).toBe('');
  });

  it('handles cookie values that contain an equals sign', () => {
    document.cookie = 'token=abc=def; path=/';
    expect(getCookie('token')).toBe('abc=def');
  });
});

describe('setCookie', () => {
  beforeEach(() => {
    document.cookie.split(';').forEach((c) => {
      const [name] = c.split('=');
      document.cookie = `${name.trim()}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/`;
    });
  });

  it('sets a cookie that can be retrieved by getCookie', () => {
    setCookie('myKey', 'myValue', 7);
    expect(getCookie('myKey')).toBe('myValue');
  });

  it('sets a cookie with an empty string value', () => {
    setCookie('emptyVal', '', 7);
    expect(getCookie('emptyVal')).toBe('');
  });

  it('overwrites an existing cookie with the same name', () => {
    setCookie('color', 'blue', 7);
    expect(getCookie('color')).toBe('blue');
    setCookie('color', 'red', 7);
    expect(getCookie('color')).toBe('red');
  });

  it('sets a session cookie (0 days) that is accessible in the same session', () => {
    setCookie('session', 'active', 0);
    // A zero-day cookie has no expiry so it becomes a session cookie — still readable
    expect(getCookie('session')).toBe('active');
  });

  it('sets a cookie with special characters in the value', () => {
    setCookie('info', 'hello world', 1);
    expect(getCookie('info')).toBe('hello world');
  });

  it('sets multiple cookies independently', () => {
    setCookie('a', '1', 1);
    setCookie('b', '2', 1);
    expect(getCookie('a')).toBe('1');
    expect(getCookie('b')).toBe('2');
  });
});
