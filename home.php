<?php
/**
 * pages/home.php
 *
 * Landing page: Hero section + Feature Split.
 */
?>

<!-- ══ HERO ══ -->
<section class="hero" aria-label="Welcome banner">

  <!-- Background image -->
  <div class="hero__image-wrap">
    <img
      src="https://images.unsplash.com/photo-1507842217343-583bb7270b66?q=80&w=2190&auto=format&fit=crop"
      alt="Classic library interior with tall bookshelves"
      class="hero__image"
      loading="eager"
      width="2190"
      height="1460"
    />
    <div class="hero__overlay" aria-hidden="true"></div>
  </div>

  <!-- Glassmorphism card -->
  <div class="hero__content-wrapper" aria-hidden="true"><!-- spacing wrapper --></div>

  <div class="container" style="position:relative;">
    <div class="hero__card">
      <h2 class="hero__title">The JBC ATHENAEUM</h2>
      <p class="hero__description">
        Gain immediate access to premium lecture notes, standardized past examination
        papers, and peer-reviewed study materials. Built to streamline learning for
        BCA, BSW, and BBS scholars.
      </p>
      <a href="?page=resources" class="btn btn--primary">
        <span>Access Resources</span>
        <span class="btn__arrow" aria-hidden="true"><?= icon('arrow-right', 18) ?></span>
      </a>
    </div>
  </div>

</section><!-- /.hero -->

<!-- ══ FEATURE SPLIT ══ -->
<main class="container" style="flex:1;">
  <section class="feature-split" aria-label="Explore curriculum">

    <!-- Image column -->
    <div class="feature-split__image-col">
      <img
        src="https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?q=80&w=2000&auto=format&fit=crop"
        alt="Student studying with books and notes spread on a desk"
        loading="lazy"
        width="2000"
        height="1333"
      />
    </div>

    <!-- Content column -->
    <div class="feature-split__content-col">
      <h2 class="feature-split__title">Explore Your Curriculum</h2>
      <p class="feature-split__description">
        Navigate through our comprehensively structured database of academic materials.
        Whether you're looking for introductory concepts in Social Work or advanced
        database management systems in BCA, everything is organized semester by semester
        for your convenience.
      </p>
      <a href="?page=viewer&subject=System+Architecture" class="btn btn--outline-navy">
        <span>Browse Directories</span>
        <span class="btn__arrow" aria-hidden="true"><?= icon('arrow-right', 16) ?></span>
      </a>
    </div>

  </section>
</main>
