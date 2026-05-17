<?php
/**
 * pages/library.php
 *
 * Library Archives — global academic search (routes to Google Scholar).
 */
?>

<main class="container--4xl container page-view page-view--padded-bottom" id="main-content">

  <!-- Page header -->
  <header class="page-header">
    <h1 class="page-header__title">Library Archives</h1>
    <p class="page-header__subtitle">
      Search for academic articles, books, and research papers across global databases.
    </p>
  </header>

  <div class="library-hero">

    <div class="library-search-card">
      <div style="display:flex; flex-direction:column; align-items:center; text-align:center;">

        <span aria-hidden="true" style="color:var(--color-gold); margin-bottom:var(--space-6);">
          <?= icon('book-open', 64) ?>
        </span>

        <h2 style="font-family:var(--font-serif); font-size:1.5rem; font-weight:700; color:var(--color-navy); margin-bottom:var(--space-4);">
          Global Academic Search
        </h2>

        <p style="color:var(--color-slate-600); margin-bottom:var(--space-8); max-width:36rem;">
          Access millions of scholarly articles, theses, books, and court opinions from
          academic publishers, professional societies, online repositories, universities,
          and other web sources.
        </p>

        <!--
          Form opens Google Scholar in a new tab.
          JavaScript enhances the submit event; the native action
          ensures it works without JS too.
        -->
        <form
          class="library-search-form"
          id="scholar-search-form"
          action="https://scholar.google.com/scholar"
          method="GET"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Search Google Scholar"
        >
          <input type="hidden" name="q" id="scholar-q" value="" />
          <input
            type="search"
            id="scholar-input"
            class="library-search-input"
            placeholder="Search by title, author, or keywords…"
            required
            aria-label="Search query"
          />
          <button type="submit" class="library-search-btn">
            <span>Search</span>
            <?= icon('search', 16) ?>
          </button>
        </form>

        <p class="library-attribution">
          Results provided via Google Scholar
          <span aria-hidden="true"><?= icon('external-link', 12) ?></span>
        </p>

      </div>
    </div>

  </div>

</main>
