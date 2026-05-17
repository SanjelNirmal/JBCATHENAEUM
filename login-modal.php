<?php
/**
 * includes/login_modal.php
 *
 * Login modal overlay. Hidden by default; JS adds .is-open to show it.
 * Form POSTs to ?action=login (handled in index.php).
 */
?>
<div
  class="modal-overlay"
  id="login-modal"
  role="dialog"
  aria-modal="true"
  aria-labelledby="login-modal-title"
  aria-hidden="true"
>
  <div class="modal">

    <!-- Modal Header -->
    <div class="modal__header">
      <div>
        <h2 class="modal__title" id="login-modal-title">Student Login</h2>
        <p class="modal__subtitle">Access member features and saved notes</p>
      </div>
      <button
        class="modal__close"
        id="modal-close"
        aria-label="Close login dialog"
      >
        <?= icon('x', 24) ?>
      </button>
    </div>

    <!-- Modal Body -->
    <div class="modal__body">

      <?php if (!empty($_SESSION['login_error'])): ?>
        <div class="modal__error" role="alert">
          <?= htmlspecialchars($_SESSION['login_error']) ?>
        </div>
        <?php unset($_SESSION['login_error']); ?>
      <?php endif; ?>

      <form
        action="?action=login"
        method="POST"
        class="modal__form-fields"
        id="login-form"
        novalidate
      >
        <!-- CSRF token -->
        <input type="hidden" name="csrf_token" value="<?= htmlspecialchars($_SESSION['csrf_token'] ?? '') ?>" />

        <!-- Email -->
        <div class="form-group">
          <label class="form-label" for="login-email">Email Address</label>
          <div class="form-input-wrap">
            <span class="form-input-icon" aria-hidden="true">
              <?= icon('mail', 18) ?>
            </span>
            <input
              type="email"
              id="login-email"
              name="email"
              class="form-input form-input--icon-left"
              placeholder="name@example.com"
              required
              autocomplete="email"
            />
          </div>
        </div>

        <!-- Password -->
        <div class="form-group">
          <label class="form-label" for="login-password">Password</label>
          <div class="form-input-wrap">
            <span class="form-input-icon" aria-hidden="true">
              <?= icon('lock', 18) ?>
            </span>
            <input
              type="password"
              id="login-password"
              name="password"
              class="form-input form-input--icon-left"
              placeholder="••••••••"
              required
              autocomplete="current-password"
            />
          </div>
        </div>

        <button type="submit" class="modal__submit" id="login-submit">
          Sign In
        </button>
      </form>

      <p class="modal__footer-note">
        Don't have an account?
        <a href="?page=info&section=IT+Support+Desk" style="color:var(--color-navy); font-weight:700;">
          Contact IT Desk
        </a>
      </p>

    </div><!-- /.modal__body -->
  </div><!-- /.modal -->
</div><!-- /.modal-overlay -->
