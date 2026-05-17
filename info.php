<?php
/**
 * pages/info.php
 *
 * Polymorphic info page — renders different content based on ?section= param.
 * Replaces the React InfoView component and its InfoContent switch statement.
 */

$section = isset($_GET['section']) ? trim($_GET['section']) : 'Support';

// Allowed sections (whitelist for safety)
$allowed_sections = [
    'Terms of Service', 'Privacy Policy', 'Academic Integrity', 'Copyright Guidelines',
    'Faculty Directory', 'Library Administration', 'IT Support Desk',
    'Submit Feedback', 'Report an Error', 'FAQ & Guides', 'Upload Instructions', 'Sitemap',
];

if (!in_array($section, $allowed_sections)) {
    $section = 'Support';
}

// Feedback form submission
$feedback_submitted = isset($_SESSION['feedback_submitted']) && $_SESSION['feedback_submitted'];
if ($feedback_submitted) {
    unset($_SESSION['feedback_submitted']);
}
?>

<main class="container--3xl container page-view page-view--padded-bottom" id="main-content">

  <!-- Page header -->
  <header class="page-header page-header--left">
    <h1 class="page-header__title"><?= htmlspecialchars($section) ?></h1>
    <p class="page-header__subtitle">Information, policies, and guidelines</p>
  </header>

  <!-- Content card -->
  <div class="card" style="padding:var(--space-8) var(--space-12); margin-bottom:var(--space-12);">

    <!-- Status info box -->
    <div class="info-status-box" role="note">
      <span style="color:var(--color-navy); flex-shrink:0; margin-top:2px;" aria-hidden="true">
        <?= icon('info', 20) ?>
      </span>
      <div style="font-size:0.875rem; color:var(--color-slate-700);">
        <h4 style="font-weight:700; color:var(--color-navy); margin-bottom:var(--space-1);">Status</h4>
        <p>This document is current and applies to all users of the JBC ATHENAEUM.</p>
      </div>
    </div>

    <!-- Dynamic content -->
    <div class="info-content">
      <?php switch ($section):

        // ── Terms of Service ──────────────────────────────────────
        case 'Terms of Service': ?>
          <h2>1. Acceptance of Terms</h2>
          <p>By accessing and using the JBC ATHENAEUM, you accept and agree to be bound by the terms and provisions of this agreement. These terms apply to all visitors, students, and faculty who access or use the Service.</p>

          <h2>2. Academic Use Only</h2>
          <p>The resources provided herein are strictly for educational and non-commercial purposes. You may not sell, redistribute for profit, or commercialise any notes, documents, or materials obtained from this archive.</p>

          <h2>3. User Contributions</h2>
          <p>By submitting notes through our contribution system, you grant the Archive a non-exclusive, royalty-free licence to distribute and display the content for academic purposes. You ensure that you are the original creator or have permission to share the material.</p>
          <?php break; ?>

        <?php // ── Privacy Policy ───────────────────────────────────── ?>
        <?php case 'Privacy Policy': ?>
          <h2>Data Collection</h2>
          <p>We collect limited information required to provide and improve the JBC ATHENAEUM services. This may include your academic email (if logged in), IP address for security purposes, and usage metrics to determine popular subjects.</p>

          <h2>Data Usage</h2>
          <p>Your data is never sold to third parties. We use it solely to maintain the integrity of our platform, communicate regarding your contributions, and send requested newsletter updates.</p>
          <?php break; ?>

        <?php // ── Academic Integrity ───────────────────────────────── ?>
        <?php case 'Academic Integrity': ?>
          <div class="warning-box">
            <p>Plagiarism and unauthorised copying strictly violate our core principles.</p>
          </div>
          <p>The JBC ATHENAEUM is a supplementary study tool. Notes and assignments found here should be used to understand concepts, not to be copied and passed off as your own work. Always cite your sources and adhere strictly to the university's academic honesty policies.</p>
          <?php break; ?>

        <?php // ── Copyright Guidelines ─────────────────────────────── ?>
        <?php case 'Copyright Guidelines': ?>
          <p>We respect intellectual property. Do not upload commercially published textbooks, copyrighted research papers (without open-access licences), or premium paid study materials.</p>
          <ul>
            <li>Only upload your own handwritten/typed notes or assignments.</li>
            <li>Professors' slides can only be uploaded if they have given explicit permission.</li>
            <li>Past examination papers are generally considered public academic records and are permitted.</li>
          </ul>
          <?php break; ?>

        <?php // ── Faculty Directory ─────────────────────────────────── ?>
        <?php case 'Faculty Directory': ?>
          <div class="faculty-card-grid">
            <div class="faculty-card">
              <h3 class="faculty-card__name">Prof. Ram Sharma</h3>
              <p class="faculty-card__role">Head of BCA Department</p>
              <div class="faculty-card__contact">
                <span class="faculty-card__contact-item">
                  <?= icon('mail', 14) ?>
                  r.sharma@janabhawana.edu.np
                </span>
                <span class="faculty-card__contact-item">
                  <?= icon('phone', 14) ?>
                  Ext. 104
                </span>
              </div>
            </div>
            <div class="faculty-card">
              <h3 class="faculty-card__name">Dr. Sita Karki</h3>
              <p class="faculty-card__role">Head of BSW Department</p>
              <div class="faculty-card__contact">
                <span class="faculty-card__contact-item">
                  <?= icon('mail', 14) ?>
                  s.karki@janabhawana.edu.np
                </span>
                <span class="faculty-card__contact-item">
                  <?= icon('phone', 14) ?>
                  Ext. 108
                </span>
              </div>
            </div>
          </div>
          <?php break; ?>

        <?php // ── Library Administration ────────────────────────────── ?>
        <?php case 'Library Administration': ?>
          <h2>Central Library Contact</h2>
          <div class="contact-grid">
            <div class="contact-grid__item">
              <?= icon('map-pin', 16) ?>
              <span>Main Campus Building, Ground Floor</span>
            </div>
            <div class="contact-grid__item">
              <?= icon('mail', 16) ?>
              <span>library@janabhawana.edu.np</span>
            </div>
            <div class="contact-grid__item">
              <?= icon('phone', 16) ?>
              <span>+977-1-5555555</span>
            </div>
          </div>
          <p style="font-size:0.875rem; color:var(--color-slate-600); margin-top:var(--space-4);">
            Working Hours: Sunday to Friday, 7:00 AM – 5:00 PM
          </p>
          <?php break; ?>

        <?php // ── IT Support Desk ───────────────────────────────────── ?>
        <?php case 'IT Support Desk': ?>
          <p>Having trouble logging in or accessing a resource? Our IT team is here to help.</p>
          <div class="support-grid">
            <div class="support-box">
              <span aria-hidden="true" style="color:var(--color-navy); display:flex; justify-content:center; margin-bottom:var(--space-3);">
                <?= icon('mail', 24) ?>
              </span>
              <h3 style="font-weight:700; color:var(--color-navy); margin-bottom:var(--space-2);">Email Support</h3>
              <p style="font-size:0.875rem; color:var(--color-slate-600);">it.support@janabhawana.edu.np</p>
            </div>
            <div class="support-box">
              <span aria-hidden="true" style="color:var(--color-navy); display:flex; justify-content:center; margin-bottom:var(--space-3);">
                <?= icon('phone', 24) ?>
              </span>
              <h3 style="font-weight:700; color:var(--color-navy); margin-bottom:var(--space-2);">Call Helpdesk</h3>
              <p style="font-size:0.875rem; color:var(--color-slate-600);">+977-1-4444444</p>
            </div>
          </div>
          <?php break; ?>

        <?php // ── Submit Feedback / Report an Error ────────────────── ?>
        <?php case 'Submit Feedback':
        case 'Report an Error': ?>
          <?php if ($feedback_submitted): ?>
            <div class="success-state" role="status">
              <div class="success-state__icon" aria-hidden="true">
                <?= icon('send', 24) ?>
              </div>
              <h2 style="font-family:var(--font-serif); font-size:1.5rem; color:var(--color-navy); margin-bottom:var(--space-2);">Thank You!</h2>
              <p style="color:var(--color-slate-600);">Your message has been received.</p>
            </div>

          <?php else: ?>
            <form action="?action=feedback&section=<?= urlencode($section) ?>" method="POST" style="max-width:36rem;">
              <input type="hidden" name="csrf_token" value="<?= htmlspecialchars($_SESSION['csrf_token'] ?? '') ?>">
              <p style="color:var(--color-slate-600); margin-bottom:var(--space-6);">
                <?= $section === 'Report an Error'
                    ? 'Found a broken link or incorrect document? Let us know.'
                    : 'We love hearing how we can improve the platform.' ?>
              </p>
              <div class="form-group" style="margin-bottom:var(--space-4);">
                <label class="form-label" for="feedback-name">Your Name (Optional)</label>
                <input type="text" id="feedback-name" name="name" class="form-input" />
              </div>
              <div class="form-group" style="margin-bottom:var(--space-4);">
                <label class="form-label" for="feedback-msg">Message</label>
                <textarea id="feedback-msg" name="message" class="form-textarea" rows="5" required></textarea>
              </div>
              <button type="submit" class="btn btn--navy">Submit</button>
            </form>

          <?php endif; ?>
          <?php break; ?>

        <?php // ── FAQ & Guides ──────────────────────────────────────── ?>
        <?php case 'FAQ & Guides': ?>
          <div class="faq-item">
            <h3 class="faq-item__q">Q: How do I download a PDF?</h3>
            <p class="faq-item__a">Open the document in the Note Viewer and click <strong>Open in Drive</strong> at the top right of the viewer — you can then download from Google Drive directly.</p>
          </div>
          <div class="faq-item">
            <h3 class="faq-item__q">Q: Why isn't the document loading?</h3>
            <p class="faq-item__a">Some networks block Google Drive iframes. If this happens, try accessing from a different network, or use the <strong>Open in Drive</strong> button as a fallback.</p>
          </div>
          <div class="faq-item">
            <h3 class="faq-item__q">Q: Who can upload notes?</h3>
            <p class="faq-item__a">Any student can submit notes via the <strong>Contribute</strong> page. They will be reviewed by an admin before becoming publicly available.</p>
          </div>
          <?php break; ?>

        <?php // ── Upload Instructions ───────────────────────────────── ?>
        <?php case 'Upload Instructions': ?>
          <h2>Step-by-Step Guide</h2>
          <ol>
            <li>Navigate to the <strong>Contribute</strong> page from the top navigation menu.</li>
            <li>Fill out the form with accurate details regarding the Faculty, Semester, and Subject.</li>
            <li>Click <strong>Generate Email to Submit</strong>. This will open your default email client.</li>
            <li><strong>Crucial:</strong> Attach your PDF files to the email before sending.</li>
            <li>The admins will review your submission and upload it within 48 hours.</li>
          </ol>
          <?php break; ?>

        <?php // ── Sitemap ───────────────────────────────────────────── ?>
        <?php case 'Sitemap': ?>
          <div class="sitemap-grid">
            <div>
              <h4 class="sitemap-col__title">Main</h4>
              <ul class="sitemap-col__list">
                <li><a href="?" style="color:var(--color-gold);">Home</a></li>
                <li><a href="?page=semesters" style="color:var(--color-gold);">Semesters Overview</a></li>
                <li><a href="?page=resources" style="color:var(--color-gold);">All Resources</a></li>
                <li><a href="?page=contribute" style="color:var(--color-gold);">Contribute Notes</a></li>
              </ul>
            </div>
            <div>
              <h4 class="sitemap-col__title">Faculties</h4>
              <ul class="sitemap-col__list">
                <li>BCA (Computing)</li>
                <li>BSW (Social Work)</li>
                <li>BBS (Business)</li>
                <li>BICTE (ICT)</li>
              </ul>
            </div>
          </div>
          <?php break; ?>

        <?php // ── Default / Under Construction ──────────────────────── ?>
        <?php default: ?>
          <span style="color:#eab308;" aria-hidden="true"><?= icon('alert-triangle', 32) ?></span>
          <h2>Under Construction</h2>
          <p>
            The full details for <strong><?= htmlspecialchars($section) ?></strong> are currently
            being drafted and reviewed by the administration. Please check back later.
          </p>

      <?php endswitch; ?>
    </div><!-- /.info-content -->

  </div><!-- /.card -->

</main>
