<?php
/**
 * pages/contribute.php
 *
 * Contribution form — generates a mailto: link with pre-filled body.
 * Pure server-side rendering; the mailto action is handled by JS
 * to avoid exposing the admin email address in the HTML source
 * (configure via ADMIN_CONTACT_EMAIL env var).
 */

$admin_email = getenv('ADMIN_CONTACT_EMAIL') ?: 'admin@jbcathenaeum.edu.np';
?>

<main class="container--4xl container page-view page-view--padded-bottom" id="main-content">

  <!-- Page header -->
  <header class="page-header">
    <h1 class="page-header__title">Contribute Notes</h1>
    <p class="page-header__subtitle">
      Help grow the archive by submitting your class notes, summaries, or past papers.
    </p>
  </header>

  <!-- Form card -->
  <div class="card" style="padding:var(--space-8) var(--space-12); margin-bottom:var(--space-12);">

    <!-- Info box -->
    <div class="contribute-info-box" role="note">
      <span class="contribute-info-box__icon" aria-hidden="true"><?= icon('info', 20) ?></span>
      <div style="font-size:0.875rem; color:var(--color-slate-700);">
        <h4 style="font-weight:700; color:var(--color-navy); margin-bottom:var(--space-1);">How it works</h4>
        <p>
          Fill out the details below and click <strong>Generate Email to Submit</strong>.
          Your default email client will open with a pre-filled template — simply
          attach your PDF files and send. Once approved by an administrator,
          your notes will be published in the archive.
        </p>
      </div>
    </div>

    <form
      id="contribute-form"
      novalidate
      data-admin-email="<?= htmlspecialchars($admin_email) ?>"
    >

      <div class="form-grid-2">

        <!-- Full name -->
        <div class="form-group">
          <label class="form-label" for="contrib-name">Your Full Name</label>
          <input
            type="text"
            id="contrib-name"
            name="name"
            class="form-input"
            placeholder="e.g. Alina Shrestha"
            required
          />
        </div>

        <!-- Subject -->
        <div class="form-group">
          <label class="form-label" for="contrib-subject">Subject / Topic</label>
          <input
            type="text"
            id="contrib-subject"
            name="subject"
            class="form-input"
            placeholder="e.g. Advanced Networking"
            required
          />
        </div>

        <!-- Faculty -->
        <div class="form-group">
          <label class="form-label" for="contrib-faculty">Faculty</label>
          <select
            id="contrib-faculty"
            name="faculty"
            class="form-select"
          >
            <option value="BCA">Computer Applications (BCA)</option>
            <option value="BICTE">Information &amp; Communication Tech (BICTE)</option>
            <option value="BSW">Social Work (BSW)</option>
            <option value="BBS">Business Studies (BBS)</option>
          </select>
        </div>

        <!-- Semester / Year (label swapped by JS) -->
        <div class="form-group">
          <label class="form-label" id="period-label" for="contrib-period">Semester</label>
          <select
            id="contrib-period"
            name="period"
            class="form-select"
          >
            <!-- Options injected by main.js based on faculty selection -->
          </select>
        </div>

      </div><!-- /.form-grid-2 -->

      <!-- Remarks -->
      <div class="form-group" style="margin-top:var(--space-6);">
        <label class="form-label" for="contrib-remarks">Additional Remarks (Optional)</label>
        <textarea
          id="contrib-remarks"
          name="remarks"
          class="form-textarea"
          rows="4"
          placeholder="Any details about the notes — chapters covered, references, quality, etc."
        ></textarea>
      </div>

      <!-- Submit -->
      <div class="form-actions">
        <button type="submit" class="btn btn--navy">
          <?= icon('mail', 16) ?>
          <span>Generate Email to Submit</span>
        </button>
      </div>

    </form>
  </div><!-- /.card -->

  <!-- Process steps -->
  <div class="contribute-steps" aria-label="Contribution process">

    <div class="contribute-step">
      <div class="contribute-step__icon-wrap" aria-hidden="true">
        <?= icon('upload', 20) ?>
      </div>
      <h4 class="contribute-step__title">1. Submit Request</h4>
      <p class="contribute-step__desc">Email your notes using the form above. PDF files are preferred.</p>
    </div>

    <div class="contribute-step">
      <div class="contribute-step__icon-wrap" aria-hidden="true">
        <?= icon('file-check', 20) ?>
      </div>
      <h4 class="contribute-step__title">2. Verification</h4>
      <p class="contribute-step__desc">Admins review your notes for quality, relevance, and accuracy.</p>
    </div>

    <div class="contribute-step">
      <div class="contribute-step__icon-wrap contribute-step__icon-wrap--gold" aria-hidden="true">
        <?= icon('file-check', 20) ?>
      </div>
      <h4 class="contribute-step__title">3. Published</h4>
      <p class="contribute-step__desc">Once verified, they are uploaded for all students to access freely.</p>
    </div>

  </div>

</main>
