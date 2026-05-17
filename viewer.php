<?php
/**
 * pages/viewer.php
 *
 * Note viewer — sidebar list of notes + iframe PDF viewer.
 * Reads: $subject_param (from index.php), $SUBJECTS (from data.php)
 *
 * Active note is driven by ?note=<note_id> GET param;
 * defaults to first note if absent.
 */

$subject_param = isset($_GET['subject']) ? trim($_GET['subject']) : 'System Architecture';
$subject = get_subject_by_name($SUBJECTS, $subject_param);

// Fallback to first subject if not found
if (!$subject) {
    $subject = $SUBJECTS[0] ?? [
        'id'       => 'placeholder',
        'name'     => $subject_param,
        'faculty'  => '-',
        'semester' => '-',
        'notes'    => [],
    ];
}

$active_note_id = isset($_GET['note']) ? $_GET['note'] : null;
$notes          = $subject['notes'];

// Determine active note
$active_note = null;
if ($notes) {
    if ($active_note_id) {
        foreach ($notes as $n) {
            if ($n['id'] === $active_note_id) {
                $active_note = $n;
                break;
            }
        }
    }
    if (!$active_note) {
        $active_note = $notes[0];
    }
}

// Generate share URL
$share_url = (isset($_SERVER['HTTPS']) ? 'https' : 'http') . '://' . $_SERVER['HTTP_HOST']
    . $_SERVER['PHP_SELF'] . '?page=viewer&subject=' . urlencode($subject['name']);
?>

<main class="container page-view page-view--padded-bottom" id="main-content">

  <div class="note-viewer-layout">

    <!-- ══ Sidebar ══ -->
    <aside class="note-viewer__sidebar" aria-label="Notes in this subject">

      <div>
        <span class="note-viewer__sidebar-badge">
          <?= htmlspecialchars($subject['faculty']) ?> &bull; <?= htmlspecialchars($subject['semester']) ?>
        </span>
      </div>

      <h2 class="note-viewer__sidebar-title"><?= htmlspecialchars($subject['name']) ?></h2>

      <p class="note-viewer__sidebar-label">Other Notes in this Subject</p>

      <?php if (empty($notes)): ?>
        <p style="font-size:0.875rem; color:var(--color-slate-500); font-style:italic;">
          No notes uploaded yet.
        </p>
      <?php else: ?>
        <ul style="display:flex; flex-direction:column;">
          <?php foreach ($notes as $note): ?>
            <?php $is_active = $active_note && $active_note['id'] === $note['id']; ?>
            <li>
              <a
                href="?page=viewer&subject=<?= urlencode($subject['name']) ?>&note=<?= urlencode($note['id']) ?>"
                class="note-list-item <?= $is_active ? 'is-active' : '' ?>"
                aria-current="<?= $is_active ? 'true' : 'false' ?>"
              >
                <div class="note-list-item__header">
                  <span class="note-list-item__title"><?= htmlspecialchars($note['title']) ?></span>
                  <?php if ($is_active): ?>
                    <span class="note-list-item__viewing-badge" aria-label="Currently viewing">Viewing</span>
                  <?php endif; ?>
                </div>
                <p class="note-list-item__meta">
                  By <?= htmlspecialchars($note['author']) ?> &bull; <?= htmlspecialchars($note['size']) ?>
                </p>
              </a>
            </li>
          <?php endforeach; ?>
        </ul>
      <?php endif; ?>

    </aside><!-- /.note-viewer__sidebar -->

    <!-- ══ Main Content ══ -->
    <section class="note-viewer__main" aria-label="Document viewer">

      <?php if ($active_note): ?>

        <!-- Document header -->
        <header class="note-viewer__doc-header">
          <h1 class="note-viewer__doc-title"><?= htmlspecialchars($active_note['title']) ?></h1>
          <div class="note-viewer__doc-meta">

            <div class="note-viewer__doc-meta-item">
              <?= icon('user', 16) ?>
              <span>
                Uploaded by <strong><?= htmlspecialchars($active_note['author']) ?></strong>
              </span>
            </div>

            <div class="note-viewer__doc-meta-item">
              <?= icon('calendar', 16) ?>
              <span><?= htmlspecialchars($active_note['date']) ?></span>
            </div>

            <div class="note-viewer__doc-actions">
              <!-- Share button (copies URL via JS) -->
              <button
                class="note-viewer__btn-share"
                id="share-btn"
                data-url="<?= htmlspecialchars($share_url) ?>"
                aria-label="Copy link to this document"
              >
                <?= icon('share-2', 16) ?>
                <span id="share-btn-label">Share</span>
              </button>

              <!-- Open in Drive -->
              <?php
              $drive_url = str_replace('/preview', '/view', $active_note['url'] ?? '');
              ?>
              <a
                href="<?= htmlspecialchars($drive_url) ?>"
                target="_blank"
                rel="noopener noreferrer"
                class="note-viewer__btn-open"
              >
                <?= icon('external-link', 14) ?>
                <span>Open in Drive</span>
              </a>
            </div>

          </div>
        </header>

        <!-- PDF Iframe Viewer -->
        <div class="note-viewer__iframe-wrap">
          <!-- Fallback shown if iframe fails to load -->
          <div class="note-viewer__iframe-fallback" aria-hidden="true">
            <p class="note-viewer__iframe-fallback-title">Document Viewer</p>
            <p style="font-size:0.75rem;">Loading preview from Google Drive…</p>
          </div>
          <iframe
            src="<?= htmlspecialchars($active_note['url'] ?? '') ?>"
            class="note-viewer__iframe"
            title="PDF Document Viewer: <?= htmlspecialchars($active_note['title']) ?>"
            allow="autoplay"
            loading="lazy"
          ></iframe>
        </div>

      <?php else: ?>

        <div class="note-viewer__empty">
          <h2 style="font-family:var(--font-serif); font-size:1.5rem; color:var(--color-navy); margin-bottom:var(--space-2);">
            No notes available
          </h2>
          <p style="color:var(--color-slate-500);">
            There are currently no notes uploaded for this subject.
          </p>
        </div>

      <?php endif; ?>

    </section><!-- /.note-viewer__main -->

  </div><!-- /.note-viewer-layout -->

</main>
