<?php

declare(strict_types=1);
session_start();

require __DIR__ . '/includes/data.php';

function esc(string $value): string
{
    return htmlspecialchars($value, ENT_QUOTES, 'UTF-8');
}

$view = $_GET['view'] ?? 'home';
$q = trim($_GET['q'] ?? '');
$subjectName = $_GET['subject'] ?? 'System Architecture';
$infoTitle = $_GET['page'] ?? 'Terms of Service';
$loginError = '';
$contributeMailto = '';

if (isset($_GET['logout'])) {
    unset($_SESSION['admin']);
    header('Location: /index.php');
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST' && ($_POST['action'] ?? '') === 'login') {
    $adminEmail = getenv('ADMIN_EMAIL') ?: '';
    $adminPassword = getenv('ADMIN_PASSWORD') ?: '';

    $email = trim($_POST['email'] ?? '');
    $password = (string) ($_POST['password'] ?? '');

    if ($adminEmail !== '' && hash_equals($adminEmail, $email) && $adminPassword !== '' && hash_equals($adminPassword, $password)) {
        $_SESSION['admin'] = true;
        header('Location: /index.php?view=admin');
        exit;
    }

    $loginError = 'Invalid credentials.';
}

if ($_SERVER['REQUEST_METHOD'] === 'POST' && ($_POST['action'] ?? '') === 'contribute') {
    $name = trim($_POST['name'] ?? '');
    $faculty = trim($_POST['faculty'] ?? '');
    $semester = trim($_POST['semester'] ?? '');
    $subject = trim($_POST['subject'] ?? '');
    $description = trim($_POST['description'] ?? '');

    $subjectLine = rawurlencode("Note Contribution: {$subject} - {$faculty} {$semester}");
    $body = rawurlencode("Hello Admin,\n\nI would like to contribute notes for the archive.\n\nUploader Name: {$name}\nFaculty: {$faculty}\nSemester: {$semester}\nSubject: {$subject}\n\nDescription/Remarks:\n{$description}\n\nPlease attach your PDF/document files before sending.\n");
    $contributeMailto = "mailto:hackingwithnirmal@gmail.com?subject={$subjectLine}&body={$body}";
    $view = 'contribute';
}

if ($view === 'library' && isset($_GET['scholar_q']) && trim($_GET['scholar_q']) !== '') {
    $scholar = rawurlencode(trim($_GET['scholar_q']));
    header("Location: https://scholar.google.com/scholar?q={$scholar}");
    exit;
}

$subjectsByName = [];
$allNotes = [];
$searchResults = [];
$grouped = [];

foreach ($subjects as $subject) {
    $subjectsByName[$subject['name']] = $subject;
    $grouped[$subject['faculty']][$subject['semester']][] = $subject;
    foreach ($subject['notes'] as $note) {
        $allNotes[] = $note + [
            'subject' => $subject['name'],
            'faculty' => $subject['faculty'],
            'semester' => $subject['semester'],
        ];
    }
}

usort($allNotes, static fn(array $a, array $b): int => strtotime($b['date']) <=> strtotime($a['date']));

if ($q !== '') {
    foreach ($subjects as $subject) {
        if (stripos($subject['name'], $q) !== false || stripos($subject['faculty'], $q) !== false) {
            $searchResults[] = $subject;
        }
    }
}

$currentSubject = $subjectsByName[$subjectName] ?? $subjects[0];
$currentNoteId = $_GET['note'] ?? ($currentSubject['notes'][0]['id'] ?? null);
$currentNote = null;

foreach ($currentSubject['notes'] as $note) {
    if ($note['id'] === $currentNoteId) {
        $currentNote = $note;
        break;
    }
}

if ($currentNote === null && !empty($currentSubject['notes'])) {
    $currentNote = $currentSubject['notes'][0];
}

$menu = [
    'home' => 'Home',
    'semesters' => 'Semesters',
    'resources' => 'Resources',
    'contribute' => 'Contribute',
    'library' => 'Library',
    'info' => 'Info',
    'admin' => 'Admin',
];
?><!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>JBC ATHENAEUM</title>
  <link rel="stylesheet" href="/assets/styles.css">
</head>
<body>
<header>
  <div class="topbar">
    <div class="container">
      <form method="get" action="/index.php">
        <input type="hidden" name="view" value="resources">
        <input type="text" name="q" value="<?= esc($q) ?>" placeholder="Search subjects...">
        <button type="submit">Search</button>
      </form>
      <div>
        <?php if (!empty($_SESSION['admin'])): ?>
          <a href="/index.php?logout=1">Logout</a>
        <?php else: ?>
          <a href="/index.php?view=admin">Admin Login</a>
        <?php endif; ?>
      </div>
    </div>
  </div>
  <div class="header-main">
    <div class="container">
      <a class="brand" href="/index.php">
        <h1>JBC ATHENAEUM</h1>
        <p>Note Sharing Platform</p>
      </a>
      <nav class="nav">
        <?php foreach ($menu as $key => $label): ?>
          <a href="/index.php?view=<?= esc($key) ?>" class="<?= $view === $key ? 'active' : '' ?>"><?= esc($label) ?></a>
        <?php endforeach; ?>
      </nav>
    </div>
  </div>
</header>

<?php if ($q !== ''): ?>
<section class="section">
  <div class="container">
    <div class="card">
      <strong>Search results for "<?= esc($q) ?>"</strong>
      <?php if (empty($searchResults)): ?>
        <p>No subject found.</p>
      <?php else: ?>
        <ul class="list">
          <?php foreach ($searchResults as $s): ?>
            <li><a href="/index.php?view=viewer&subject=<?= rawurlencode($s['name']) ?>"><?= esc($s['name']) ?> (<?= esc($s['faculty']) ?>)</a></li>
          <?php endforeach; ?>
        </ul>
      <?php endif; ?>
    </div>
  </div>
</section>
<?php endif; ?>

<?php if ($view === 'home'): ?>
  <section class="hero">
    <div class="container hero-card">
      <h2>The JBC ATHENAEUM</h2>
      <p>Access lecture notes, past papers, and study materials for BCA, BSW, and BBS in one organized archive.</p>
      <a class="btn btn-accent" href="/index.php?view=resources">Access Resources</a>
    </div>
  </section>
  <section class="section">
    <div class="container">
      <div class="grid grid-2">
        <article class="card">
          <h3>Explore Your Curriculum</h3>
          <p>Browse by faculty and semester to quickly find your subject notes.</p>
          <a class="btn" href="/index.php?view=semesters">Browse Directories</a>
        </article>
        <article class="card">
          <h3>Upload and Share</h3>
          <p>Contribute your notes to help other scholars and build a stronger library.</p>
          <a class="btn btn-accent" href="/index.php?view=contribute">Upload Notes</a>
        </article>
      </div>
    </div>
  </section>
<?php elseif ($view === 'viewer'): ?>
  <section class="section">
    <div class="container viewer">
      <aside>
        <span class="badge"><?= esc($currentSubject['faculty']) ?> • <?= esc($currentSubject['semester']) ?></span>
        <h2><?= esc($currentSubject['name']) ?></h2>
        <p><strong>Notes</strong></p>
        <?php if (empty($currentSubject['notes'])): ?>
          <p>No notes uploaded yet.</p>
        <?php else: ?>
          <?php foreach ($currentSubject['notes'] as $note): ?>
            <a class="note-link <?= $currentNote && $currentNote['id'] === $note['id'] ? 'active' : '' ?>" href="/index.php?view=viewer&subject=<?= rawurlencode($currentSubject['name']) ?>&note=<?= rawurlencode($note['id']) ?>">
              <strong><?= esc($note['title']) ?></strong><br>
              <small><?= esc($note['author']) ?> • <?= esc($note['size']) ?></small>
            </a>
          <?php endforeach; ?>
        <?php endif; ?>
      </aside>
      <main>
        <?php if ($currentNote): ?>
          <h1><?= esc($currentNote['title']) ?></h1>
          <p>Uploaded by <?= esc($currentNote['author']) ?> on <?= esc($currentNote['date']) ?></p>
          <p><a class="btn" target="_blank" rel="noopener noreferrer" href="<?= esc($currentNote['url']) ?>">Open in new tab</a></p>
          <iframe src="<?= esc($currentNote['url']) ?>" title="Note preview"></iframe>
        <?php else: ?>
          <p>No notes available for this subject.</p>
        <?php endif; ?>
      </main>
    </div>
  </section>
<?php elseif ($view === 'semesters'): ?>
  <section class="section">
    <div class="container">
      <div class="section-head"><h2>Course Structure</h2></div>
      <?php foreach ($grouped as $faculty => $semesters): ?>
        <article class="card" style="margin-bottom: 16px;">
          <h3><?= esc($faculty) ?> Faculty</h3>
          <div class="grid grid-3">
            <?php ksort($semesters); foreach ($semesters as $semester => $semesterSubjects): ?>
              <div>
                <p><strong><?= esc($semester) ?></strong></p>
                <ul class="list">
                  <?php foreach ($semesterSubjects as $s): ?>
                    <li><a href="/index.php?view=viewer&subject=<?= rawurlencode($s['name']) ?>"><?= esc($s['name']) ?></a> (<?= count($s['notes']) ?> notes)</li>
                  <?php endforeach; ?>
                </ul>
              </div>
            <?php endforeach; ?>
          </div>
        </article>
      <?php endforeach; ?>
    </div>
  </section>
<?php elseif ($view === 'resources'): ?>
  <section class="section">
    <div class="container">
      <div class="section-head"><h2>All Resources</h2></div>
      <div class="grid grid-3">
        <?php if (empty($allNotes)): ?>
          <p>No resources found.</p>
        <?php else: ?>
          <?php foreach ($allNotes as $note): ?>
            <article class="card">
              <p><span class="badge"><?= esc($note['faculty']) ?> • <?= esc($note['semester']) ?></span></p>
              <h3><?= esc($note['title']) ?></h3>
              <p><a href="/index.php?view=viewer&subject=<?= rawurlencode($note['subject']) ?>"><?= esc($note['subject']) ?></a></p>
              <small>By <?= esc($note['author']) ?> • <?= esc($note['size']) ?></small>
            </article>
          <?php endforeach; ?>
        <?php endif; ?>
      </div>
    </div>
  </section>
<?php elseif ($view === 'contribute'): ?>
  <section class="section">
    <div class="container">
      <div class="section-head"><h2>Contribute Notes</h2></div>
      <div class="card">
        <div class="notice">Fill this form to generate a submission email template.</div>
        <form method="post" action="/index.php?view=contribute">
          <input type="hidden" name="action" value="contribute">
          <div class="form-grid">
            <input required name="name" placeholder="Your full name">
            <input required name="subject" placeholder="Subject / Topic">
            <select name="faculty">
              <option>BCA</option>
              <option>BICTE</option>
              <option>BSW</option>
              <option>BBS</option>
            </select>
            <input required name="semester" placeholder="Semester / Year">
          </div>
          <p><textarea name="description" rows="5" placeholder="Additional remarks"></textarea></p>
          <button type="submit">Generate Email</button>
        </form>
        <?php if ($contributeMailto !== ''): ?>
          <p><a class="btn btn-accent" href="<?= esc($contributeMailto) ?>">Open Email Client</a></p>
        <?php endif; ?>
      </div>
    </div>
  </section>
<?php elseif ($view === 'library'): ?>
  <section class="section">
    <div class="container">
      <div class="section-head"><h2>Library Archives</h2></div>
      <div class="card">
        <p>Search across global academic publications via Google Scholar.</p>
        <form method="get" action="/index.php">
          <input type="hidden" name="view" value="library">
          <input required name="scholar_q" placeholder="Search by title, author, or keyword" style="width: min(560px, 100%);">
          <button type="submit">Search Scholar</button>
        </form>
      </div>
    </div>
  </section>
<?php elseif ($view === 'info'): ?>
  <section class="section">
    <div class="container">
      <div class="section-head"><h2><?= esc($infoTitle) ?></h2></div>
      <div class="card">
        <p class="notice">This document is current and applies to all users.</p>
        <?php if (!isset($infoPages[$infoTitle])): ?>
          <p>Under construction.</p>
        <?php else: ?>
          <ul class="list">
            <?php foreach ($infoPages[$infoTitle] as $line): ?>
              <li><?= esc($line) ?></li>
            <?php endforeach; ?>
          </ul>
        <?php endif; ?>
      </div>
      <div class="card" style="margin-top: 14px;">
        <strong>Open another page:</strong>
        <div class="links">
          <?php foreach (array_keys($infoPages) as $page): ?>
            <a class="badge" href="/index.php?view=info&page=<?= rawurlencode($page) ?>"><?= esc($page) ?></a>
          <?php endforeach; ?>
        </div>
      </div>
    </div>
  </section>
<?php elseif ($view === 'admin'): ?>
  <section class="section">
    <div class="container">
      <div class="section-head"><h2>Admin Dashboard</h2></div>
      <?php if (empty($_SESSION['admin'])): ?>
        <div class="card" style="max-width: 480px;">
          <?php if ($loginError !== ''): ?><p class="notice"><?= esc($loginError) ?></p><?php endif; ?>
          <form method="post" action="/index.php?view=admin">
            <input type="hidden" name="action" value="login">
            <p><input required type="email" name="email" placeholder="Admin email"></p>
            <p><input required type="password" name="password" placeholder="Password"></p>
            <button type="submit">Sign In</button>
          </form>
        </div>
      <?php else: ?>
        <div class="card">
          <p>Signed in as admin.</p>
          <div class="table-wrap">
            <table>
              <thead><tr><th>Title</th><th>Subject</th><th>Faculty</th><th>Date</th></tr></thead>
              <tbody>
              <?php foreach ($allNotes as $note): ?>
                <tr>
                  <td><?= esc($note['title']) ?></td>
                  <td><?= esc($note['subject']) ?></td>
                  <td><?= esc($note['faculty']) ?></td>
                  <td><?= esc($note['date']) ?></td>
                </tr>
              <?php endforeach; ?>
              </tbody>
            </table>
          </div>
        </div>
      <?php endif; ?>
    </div>
  </section>
<?php endif; ?>

<footer class="footer">
  <div class="container">
    <strong>JBC ATHENAEUM</strong>
    <p>"The foundation of every state is the education of its youth."</p>
    <div class="links">
      <a href="/index.php?view=info&page=Terms%20of%20Service">Terms</a>
      <a href="/index.php?view=info&page=Privacy%20Policy">Privacy</a>
      <a href="/index.php?view=info&page=FAQ%20%26%20Guides">FAQ</a>
      <a href="/index.php?view=contribute">Contribute</a>
      <a href="/index.php?view=library">Library</a>
    </div>
  </div>
</footer>
</body>
</html>
