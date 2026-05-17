<?php
/**
 * pages/resources.php
 *
 * All resources view — flat grid of every note across all subjects,
 * sorted newest-first.
 * Depends on: $SUBJECTS, get_all_notes() from includes/data.php
 */

$all_notes = get_all_notes($SUBJECTS);
?>

<main class="container page-view page-view--padded-bottom" id="main-content">

  <!-- Page header -->
  <header class="page-header">
    <h1 class="page-header__title">All Resources</h1>
    <p class="page-header__subtitle">
      Browse the latest uploaded notes and study materials across all disciplines.
    </p>
  </header>

  <!-- Resource cards grid -->
  <div class="resource-grid">

    <?php if (empty($all_notes)): ?>
      <div class="resource-empty">
        <p>No resources have been published yet. Check back soon.</p>
      </div>

    <?php else: ?>
      <?php foreach ($all_notes as $note): ?>
        <article class="resource-card" aria-label="<?= htmlspecialchars($note['title']) ?>">
          <a
            href="?page=viewer&subject=<?= urlencode($note['subject_name']) ?>"
            class="resource-card"
            style="text-decoration:none; display:flex; flex-direction:column; height:100%;"
            aria-label="View <?= htmlspecialchars($note['title']) ?>"
          >
            <div class="resource-card__header">
              <span class="resource-card__icon" aria-hidden="true">
                <?= icon('file-text', 20) ?>
              </span>
              <span class="resource-card__badge">
                <?= htmlspecialchars($note['faculty']) ?> &bull; <?= htmlspecialchars($note['semester']) ?>
              </span>
            </div>

            <h3 class="resource-card__title"><?= htmlspecialchars($note['title']) ?></h3>
            <p class="resource-card__subject"><?= htmlspecialchars($note['subject_name']) ?></p>

            <div class="resource-card__footer">
              <span>By <?= htmlspecialchars($note['author']) ?></span>
              <span><?= htmlspecialchars($note['size']) ?></span>
            </div>
          </a>
        </article>
      <?php endforeach; ?>

    <?php endif; ?>

  </div>

</main>
