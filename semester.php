<?php
/**
 * pages/semesters.php
 *
 * Course structure view — subjects grouped by faculty → semester.
 * Depends on: $SUBJECTS, group_subjects() from includes/data.php
 */

$grouped = group_subjects($SUBJECTS);
?>

<main class="container page-view page-view--padded-bottom" id="main-content">

  <!-- Page header -->
  <header class="page-header">
    <h1 class="page-header__title">Course Structure</h1>
    <p class="page-header__subtitle">Explore all subjects organised by faculty and semester.</p>
  </header>

  <!-- Faculty sections -->
  <?php foreach ($grouped as $faculty => $semesters): ?>
    <section class="faculty-section" aria-labelledby="faculty-<?= htmlspecialchars(strtolower($faculty)) ?>">

      <h2 class="faculty-section__title" id="faculty-<?= htmlspecialchars(strtolower($faculty)) ?>">
        <span class="faculty-section__badge" aria-hidden="true">
          <?= htmlspecialchars(mb_substr($faculty, 0, 1)) ?>
        </span>
        <?= htmlspecialchars($faculty) ?> Faculty
      </h2>

      <div class="semester-grid">
        <?php foreach ($semesters as $semester => $subjects): ?>
          <div class="semester-card">
            <h3 class="semester-card__label"><?= htmlspecialchars($semester) ?></h3>
            <ul class="subject-list">
              <?php foreach ($subjects as $sub): ?>
                <li>
                  <a
                    href="?page=viewer&subject=<?= urlencode($sub['name']) ?>"
                    class="subject-item"
                    aria-label="View notes for <?= htmlspecialchars($sub['name']) ?>"
                  >
                    <span class="subject-item__name"><?= htmlspecialchars($sub['name']) ?></span>
                    <span class="subject-item__count">
                      <?= count($sub['notes']) ?> note<?= count($sub['notes']) !== 1 ? 's' : '' ?>
                    </span>
                  </a>
                </li>
              <?php endforeach; ?>
            </ul>
          </div>
        <?php endforeach; ?>
      </div>

    </section>
  <?php endforeach; ?>

</main>
