<?php
/**
 * includes/header.php
 *
 * Reusable site header.
 * Expects: $SUBJECTS (from data.php), $current_page, session vars.
 */

// Determine active page for URL building
$page = $current_page ?? 'home';
?>
<header class="site-header" role="banner">

  <!-- ══ Top Utility Bar ══ -->
  <div class="header__utility-bar">

    <!-- Search -->
    <div class="header__search" id="header-search-wrap">
      <div class="header__search-input-wrap">
        <?= icon('search', 14, 'header__search-icon') ?>
        <input
          type="text"
          id="header-search-input"
          class="header__search-field"
          placeholder="Search Notes..."
          autocomplete="off"
          aria-label="Search subjects"
          aria-expanded="false"
          aria-controls="header-search-dropdown"
        />
      </div>
      <div class="header__search-dropdown" id="header-search-dropdown" role="listbox" aria-label="Search results">
        <!-- Populated by main.js -->
      </div>
    </div>

    <!-- Library Archives -->
    <a href="?page=library" class="header__util-link" style="display:none;" id="util-library">Library Archives</a>

    <?php if (isset($_SESSION['user'])): ?>
      <!-- Logged-in user controls -->
      <div class="header__user-info">
        <?php if ($_SESSION['user']['faculty'] === 'Admin'): ?>
          <a href="?page=admin" class="header__btn--gold-outline header__util-link">Dashboard</a>
        <?php endif; ?>
        <div class="header__user-text" style="display:none;" id="util-user-text">
          <div class="header__user-name"><?= htmlspecialchars($_SESSION['user']['name']) ?></div>
          <div class="header__user-role">
            <?= htmlspecialchars($_SESSION['user']['faculty']) ?>
            <?= $_SESSION['user']['faculty'] !== 'Admin' ? 'Scholar' : '' ?>
          </div>
        </div>
        <a href="?action=logout" class="header__btn--outline header__util-link">Logout</a>
      </div>
    <?php else: ?>
      <button
        class="header__util-link"
        id="login-trigger"
        aria-haspopup="dialog"
        style="display:flex; align-items:center; gap:4px;"
      >
        <?= icon('log-in', 14) ?>
        <span>Login</span>
      </button>
    <?php endif; ?>
  </div>

  <!-- ══ Main Navigation Bar ══ -->
  <div class="header__main-bar">
    <div class="header__main-bar-inner">

      <!-- Brand / Logo -->
      <a href="?" class="header__brand" aria-label="JBC ATHENAEUM – Go to home">
        <div class="header__brand-icon" aria-hidden="true">
          <?= icon('library', 20) ?>
        </div>
        <div>
          <div class="header__brand-name">JBC ATHENAEUM</div>
          <div class="header__brand-tagline">Note Sharing Platform</div>
        </div>
      </a>

      <!-- Desktop Primary Nav -->
      <nav class="header__nav" role="navigation" aria-label="Primary navigation">

        <!-- Faculties Mega Menu -->
        <div class="header__nav-faculties" tabindex="0" role="button" aria-haspopup="true" aria-expanded="false">
          <span class="header__nav-faculties-label">
            <span>Faculties</span>
            <?= icon('chevron-down', 16, 'chevron') ?>
          </span>

          <div class="mega-menu" role="menu">
            <div class="mega-menu__inner">

              <!-- BCA Column -->
              <div role="none">
                <h3 class="mega-menu__col-title">Computer Applications (BCA)</h3>
                <ul class="mega-menu__list">
                  <?php
                  $bca_subjects = ['Programming in C', 'Data Structures & Algo', 'Database Management', 'Web Technology', 'Software Engineering'];
                  foreach ($bca_subjects as $subj): ?>
                    <li>
                      <a href="?page=viewer&subject=<?= urlencode($subj) ?>" class="mega-menu__item" role="menuitem">
                        <?= htmlspecialchars($subj) ?>
                      </a>
                    </li>
                  <?php endforeach; ?>
                  <li>
                    <a href="?page=semesters" class="mega-menu__item mega-menu__item--dimmed" role="menuitem">
                      + View All Subjects
                    </a>
                  </li>
                </ul>
              </div>

              <!-- BSW Column -->
              <div role="none">
                <h3 class="mega-menu__col-title">Social Work (BSW)</h3>
                <ul class="mega-menu__list">
                  <?php
                  $bsw_subjects = ['Intro to Social Work', 'Sociology Concepts', 'Basic Psychology', 'Community Organization', 'Field Work Practicum'];
                  foreach ($bsw_subjects as $subj): ?>
                    <li>
                      <a href="?page=viewer&subject=<?= urlencode($subj) ?>" class="mega-menu__item" role="menuitem">
                        <?= htmlspecialchars($subj) ?>
                      </a>
                    </li>
                  <?php endforeach; ?>
                  <li>
                    <a href="?page=semesters" class="mega-menu__item mega-menu__item--dimmed" role="menuitem">
                      + View All Subjects
                    </a>
                  </li>
                </ul>
              </div>

              <!-- BBS Column -->
              <div role="none">
                <h3 class="mega-menu__col-title">Business Studies (BBS)</h3>
                <ul class="mega-menu__list">
                  <?php
                  $bbs_subjects = ['Microeconomics', 'Principles of Management', 'Financial Accounting', 'Business Statistics', 'Marketing Strategy'];
                  foreach ($bbs_subjects as $subj): ?>
                    <li>
                      <a href="?page=viewer&subject=<?= urlencode($subj) ?>" class="mega-menu__item" role="menuitem">
                        <?= htmlspecialchars($subj) ?>
                      </a>
                    </li>
                  <?php endforeach; ?>
                  <li>
                    <a href="?page=semesters" class="mega-menu__item mega-menu__item--dimmed" role="menuitem">
                      + View All Subjects
                    </a>
                  </li>
                </ul>
              </div>

              <!-- Featured Column -->
              <div role="none">
                <h3 class="mega-menu__col-title">Featured Collections</h3>
                <div class="mega-menu__featured">
                  <div class="mega-menu__featured-label">Exam Preparation</div>
                  <ul class="mega-menu__list" style="margin-top:8px;">
                    <li>
                      <a href="?page=resources" class="mega-menu__item" role="menuitem">Latest Past Papers</a>
                    </li>
                    <li>
                      <a href="?page=resources" class="mega-menu__item" role="menuitem">Syllabus Guidelines</a>
                    </li>
                  </ul>
                  <a href="?page=resources" class="mega-menu__featured-cta" role="menuitem">EXPLORE ARCHIVE &rarr;</a>
                </div>
              </div>

            </div>
          </div>
        </div><!-- /Faculties -->

        <a href="?page=semesters" class="header__nav-link">Semesters</a>
        <a href="?page=resources" class="header__nav-link">Resources</a>
        <a href="?page=contribute" class="header__btn--cta">Upload Notes</a>
      </nav>

      <!-- Mobile Hamburger -->
      <button
        class="header__mobile-toggle"
        id="mobile-menu-toggle"
        aria-expanded="false"
        aria-controls="mobile-nav"
        aria-label="Toggle navigation"
      >
        <span></span>
        <span></span>
        <span></span>
      </button>

    </div><!-- /.header__main-bar-inner -->

    <!-- Mobile Drawer Nav -->
    <nav class="header__mobile-nav" id="mobile-nav" aria-label="Mobile navigation" hidden>
      <a href="?page=semesters">Semesters</a>
      <a href="?page=resources">Resources</a>
      <a href="?page=contribute">Upload Notes</a>
      <a href="?page=library">Library Archives</a>
      <?php if (!isset($_SESSION['user'])): ?>
        <button id="login-trigger-mobile">Login</button>
      <?php else: ?>
        <a href="?action=logout">Logout</a>
      <?php endif; ?>
    </nav>

  </div><!-- /.header__main-bar -->

</header><!-- /.site-header -->
