<?php
/**
 * includes/footer.php
 *
 * Reusable site footer.
 * Newsletter form submits to ?action=subscribe (handled in index.php).
 */
?>
<footer class="site-footer" role="contentinfo">

  <!-- ══ Newsletter Strip ══ -->
  <div class="footer__newsletter">
    <div class="footer__newsletter-inner">

      <div>
        <h3 class="footer__newsletter-title">Subscribe to the Archives</h3>
        <p class="footer__newsletter-desc">Receive monthly summaries of new thesis uploads and faculty notes.</p>
      </div>

      <form
        class="footer__newsletter-form"
        action="?action=subscribe"
        method="POST"
        aria-label="Newsletter subscription"
      >
        <div class="footer__newsletter-input-wrap">
          <span class="footer__newsletter-icon" aria-hidden="true">
            <?= icon('mail', 18) ?>
          </span>
          <input
            type="email"
            name="email"
            class="footer__newsletter-input"
            placeholder="Your academic email..."
            required
            aria-label="Email address"
          />
        </div>
        <button type="submit" class="footer__newsletter-btn">Subscribe</button>
      </form>

    </div>
  </div>

  <!-- ══ Main Dark Footer ══ -->
  <div class="footer__dark">
    <div class="footer__dark-inner">

      <!-- Quote & Socials -->
      <div class="footer__quote-section">
        <p class="footer__quote">
          "The foundation of every state is the education of its youth."
        </p>

        <ul class="footer__social-list" aria-label="Social media links">
          <li>
            <a href="#" class="footer__social-link" aria-label="Facebook">
              <?= icon('facebook', 18) ?>
            </a>
          </li>
          <li>
            <a href="#" class="footer__social-link" aria-label="Twitter">
              <?= icon('twitter', 18) ?>
            </a>
          </li>
          <li>
            <a href="#" class="footer__social-link" aria-label="Instagram">
              <?= icon('instagram', 18) ?>
            </a>
          </li>
          <li>
            <a href="#" class="footer__social-link" aria-label="LinkedIn">
              <?= icon('linkedin', 18) ?>
            </a>
          </li>
        </ul>
      </div>

      <!-- Links Grid -->
      <div class="footer__links-grid">

        <!-- Policies -->
        <div>
          <h4 class="footer__links-col-title">Policies</h4>
          <ul class="footer__links-list">
            <?php
            $policies = ['Terms of Service', 'Privacy Policy', 'Academic Integrity', 'Copyright Guidelines'];
            foreach ($policies as $pol): ?>
              <li>
                <a href="?page=info&section=<?= urlencode($pol) ?>" class="footer__link-btn">
                  <?= htmlspecialchars($pol) ?>
                </a>
              </li>
            <?php endforeach; ?>
          </ul>
        </div>

        <!-- Contacts -->
        <div style="text-align:center;">
          <h4 class="footer__links-col-title">Contacts</h4>
          <ul class="footer__links-list" style="align-items:center;">
            <?php
            $contacts = ['Faculty Directory', 'Library Administration', 'IT Support Desk', 'Submit Feedback'];
            foreach ($contacts as $contact): ?>
              <li>
                <a href="?page=info&section=<?= urlencode($contact) ?>" class="footer__link-btn">
                  <?= htmlspecialchars($contact) ?>
                </a>
              </li>
            <?php endforeach; ?>
          </ul>
        </div>

        <!-- Support -->
        <div style="text-align:right;">
          <h4 class="footer__links-col-title">Support</h4>
          <ul class="footer__links-list" style="align-items:flex-end;">
            <?php
            $support = ['FAQ & Guides', 'Upload Instructions', 'Report an Error', 'Sitemap'];
            foreach ($support as $item): ?>
              <li>
                <a href="?page=info&section=<?= urlencode($item) ?>" class="footer__link-btn">
                  <?= htmlspecialchars($item) ?>
                </a>
              </li>
            <?php endforeach; ?>
          </ul>
        </div>

      </div><!-- /.footer__links-grid -->

      <!-- Copyright -->
      <div class="footer__copyright">
        <p>&copy; <?= date('Y') ?> JBC ATHENAEUM</p>
        <p>Designed for Scholars</p>
      </div>

    </div>
  </div>

</footer><!-- /.site-footer -->
