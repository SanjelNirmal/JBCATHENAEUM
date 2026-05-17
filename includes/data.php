<?php
/**
 * Data layer — replaces src/lib/api.ts + Supabase.
 *
 * In production, replace these static arrays with database queries
 * (e.g., PDO/MySQLi) using the same structure.
 *
 * Each "subject" has:
 *   id, name, faculty, semester, notes[]
 *
 * Each "note" has:
 *   id, title, author, date, size, url
 */

$SUBJECTS = [
    // ── BCA ──────────────────────────────────────────────
    [
        'id'       => 'bca-prog-c',
        'name'     => 'Programming in C',
        'faculty'  => 'BCA',
        'semester' => '1st Semester',
        'notes'    => [],
    ],
    [
        'id'       => 'bca-dsa',
        'name'     => 'Data Structures & Algo',
        'faculty'  => 'BCA',
        'semester' => '3rd Semester',
        'notes'    => [],
    ],
    [
        'id'       => 'bca-dbms',
        'name'     => 'Database Management',
        'faculty'  => 'BCA',
        'semester' => '4th Semester',
        'notes'    => [],
    ],
    [
        'id'       => 'bca-web',
        'name'     => 'Web Technology',
        'faculty'  => 'BCA',
        'semester' => '4th Semester',
        'notes'    => [],
    ],
    [
        'id'       => 'bca-se',
        'name'     => 'Software Engineering',
        'faculty'  => 'BCA',
        'semester' => '5th Semester',
        'notes'    => [],
    ],
    [
        'id'       => 'bca-sys-arch',
        'name'     => 'System Architecture',
        'faculty'  => 'BCA',
        'semester' => '4th Semester',
        'notes'    => [],
    ],
    [
        'id'       => 'bca-advanced',
        'name'     => 'Advanced Project',
        'faculty'  => 'BCA',
        'semester' => '8th Semester',
        'notes'    => [],
    ],
    // ── BSW ──────────────────────────────────────────────
    [
        'id'       => 'bsw-intro',
        'name'     => 'Intro to Social Work',
        'faculty'  => 'BSW',
        'semester' => '1st Year',
        'notes'    => [],
    ],
    [
        'id'       => 'bsw-sociology',
        'name'     => 'Sociology Concepts',
        'faculty'  => 'BSW',
        'semester' => '2nd Year',
        'notes'    => [],
    ],
    [
        'id'       => 'bsw-psychology',
        'name'     => 'Basic Psychology',
        'faculty'  => 'BSW',
        'semester' => '2nd Year',
        'notes'    => [],
    ],
    [
        'id'       => 'bsw-community',
        'name'     => 'Community Organization',
        'faculty'  => 'BSW',
        'semester' => '3rd Year',
        'notes'    => [],
    ],
    [
        'id'       => 'bsw-field',
        'name'     => 'Field Work Practicum',
        'faculty'  => 'BSW',
        'semester' => '4th Year',
        'notes'    => [],
    ],
    // ── BBS ──────────────────────────────────────────────
    [
        'id'       => 'bbs-micro',
        'name'     => 'Microeconomics',
        'faculty'  => 'BBS',
        'semester' => '1st Year',
        'notes'    => [],
    ],
    [
        'id'       => 'bbs-mgmt',
        'name'     => 'Principles of Management',
        'faculty'  => 'BBS',
        'semester' => '1st Year',
        'notes'    => [],
    ],
    [
        'id'       => 'bbs-acct',
        'name'     => 'Financial Accounting',
        'faculty'  => 'BBS',
        'semester' => '2nd Year',
        'notes'    => [],
    ],
    [
        'id'       => 'bbs-stats',
        'name'     => 'Business Statistics',
        'faculty'  => 'BBS',
        'semester' => '3rd Year',
        'notes'    => [],
    ],
    [
        'id'       => 'bbs-mkt',
        'name'     => 'Marketing Strategy',
        'faculty'  => 'BBS',
        'semester' => '4th Year',
        'notes'    => [],
    ],
    // ── BICTE ─────────────────────────────────────────────
    [
        'id'       => 'bicte-infosec',
        'name'     => 'Information Security',
        'faculty'  => 'BICTE',
        'semester' => '8th Semester',
        'notes'    => [],
    ],
];

// Backward-compatible alias for pages expecting lowercase variable naming.
$subjects = &$SUBJECTS;

/**
 * Get a subject by its name (case-insensitive).
 */
function get_subject_by_name(array $subjects, string $name): ?array {
    foreach ($subjects as $subject) {
        if (strtolower($subject['name']) === strtolower($name)) {
            return $subject;
        }
    }
    return null;
}

/**
 * Group subjects by faculty, then by semester.
 * Returns: ['BCA' => ['1st Semester' => [...subjects], ...], ...]
 */
function group_subjects(array $subjects): array {
    $grouped = [];
    foreach ($subjects as $sub) {
        $grouped[$sub['faculty']][$sub['semester']][] = $sub;
    }
    // Sort semester keys within each faculty
    foreach ($grouped as $faculty => &$semesters) {
        ksort($semesters);
    }
    return $grouped;
}

/**
 * Flatten all notes across all subjects for the Resources view.
 * Returns a flat array of notes with subject/faculty/semester context.
 */
function get_all_notes(array $subjects): array {
    $all = [];
    foreach ($subjects as $sub) {
        foreach ($sub['notes'] as $note) {
            $all[] = array_merge($note, [
                'subject_name' => $sub['name'],
                'faculty'      => $sub['faculty'],
                'semester'     => $sub['semester'],
            ]);
        }
    }
    // Sort newest first
    usort($all, fn($a, $b) => strtotime($b['date']) - strtotime($a['date']));
    return $all;
}

/**
 * Admin credentials — in production, use environment variables or a secrets manager.
 * Never hardcode real credentials in source code; read them from .env or server config.
 */
define('ADMIN_EMAIL',    getenv('ADMIN_EMAIL')    ?: 'admin@jbcathenaeum.edu.np');
define('ADMIN_PASSWORD', getenv('ADMIN_PASSWORD') ?: 'change_me_in_production');
define('ADMIN_NAME',     'Nirmal');
