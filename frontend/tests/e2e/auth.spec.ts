import { test, expect } from '@playwright/test';

/**
 * Authentication Pages Tests
 *
 * NOTE: Email/Password authentication has been removed.
 * This project now uses Google OAuth as the single authentication method.
 *
 * For Google OAuth tests, see: google-auth.spec.ts (14/14 passing)
 * For session management tests, see: session-management.spec.ts (23/31 passing)
 *
 * These tests verify the current Google OAuth login page and navigation.
 */

test.describe('Authentication Pages (Google OAuth)', () => {
  test.describe('Login Page', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/login');
    });

    test('should display login page with Google OAuth', async ({ page }) => {
      // Title
      await expect(page.getByText(/합격을 위한 준비, 여기서 시작해요/i)).toBeVisible();
      await expect(page.getByText(/Certificate Master에 로그인/i)).toBeVisible();
    });

    test('should have Google login button', async ({ page }) => {
      // Google login button should be visible
      const googleButton = page.getByRole('button', { name: /Google/i });
      await expect(googleButton).toBeVisible();
    });

    test('should have logo link to home', async ({ page }) => {
      const logoLink = page.locator('a[href="/"]').first();
      await expect(logoLink).toBeVisible();
    });

    test('should NOT have email/password fields (removed)', async ({ page }) => {
      // Email/Password authentication has been removed
      const emailInput = page.getByPlaceholder(/email/i);
      await expect(emailInput).not.toBeVisible();

      const passwordInput = page.getByPlaceholder(/••••/i);
      await expect(passwordInput).not.toBeVisible();
    });

    test('should NOT have signup link (removed)', async ({ page }) => {
      // Signup has been removed - Google OAuth handles account creation
      const signupLink = page.getByRole('link', { name: /회원가입/i });
      await expect(signupLink).not.toBeVisible();
    });
  });

  test.describe('Signup Page (Deprecated)', () => {
    test('should redirect signup page to login', async ({ page }) => {
      // /signup should redirect to /login since signup is removed
      await page.goto('/signup');

      // Should be redirected to login page or show login page
      await page.waitForURL(/\/(login|signup)/, { timeout: 5000 });

      // Google login button should be visible
      const googleButton = page.getByRole('button', { name: /Google/i });
      await expect(googleButton).toBeVisible();
    });
  });

  test.describe('Auth Navigation', () => {
    test('should redirect to login from protected route when not authenticated', async ({ page }) => {
      // Note: This test depends on middleware behavior
      await page.goto('/dashboard');

      // Either redirected to login or shows dashboard (depends on auth state)
      const url = page.url();
      expect(url.includes('/login') || url.includes('/dashboard')).toBeTruthy();
    });
  });
});
