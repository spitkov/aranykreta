import Database from 'better-sqlite3';
import { dev } from '$app/environment';
import fs from 'fs';
import path from 'path';

// Ensure the db directory exists
const dbDir = path.join(process.cwd(), 'db');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(path.join(dbDir, 'vote.sqlite'));

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Create tables if they don't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS teachers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE
  );

  CREATE TABLE IF NOT EXISTS classes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    grade INTEGER NOT NULL,
    section TEXT NOT NULL,
    category TEXT,
    UNIQUE(grade, section)
  );

  CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT,
    max_votes_per_code INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS event_classes (
    event_id INTEGER NOT NULL,
    class_id INTEGER NOT NULL,
    student_count INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (event_id, class_id),
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS event_teachers (
    event_id INTEGER NOT NULL,
    teacher_id INTEGER NOT NULL,
    PRIMARY KEY (event_id, teacher_id),
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS codes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id INTEGER NOT NULL,
    class_id INTEGER NOT NULL,
    code TEXT NOT NULL UNIQUE COLLATE NOCASE,
    used INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS votes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id INTEGER NOT NULL,
    code TEXT NOT NULL,
    teacher_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE,
    UNIQUE(event_id, code, teacher_id)
  );

  CREATE TABLE IF NOT EXISTS admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS event_teacher_student_counts (
    event_id INTEGER NOT NULL,
    teacher_id INTEGER NOT NULL,
    students_taught_count INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (event_id, teacher_id),
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE
  );
`);

// Create default admin if none exists
const adminCount = db.prepare('SELECT COUNT(*) as count FROM admins').get().count;
if (adminCount === 0) {
  // In a real app, you'd use a proper password hashing library
  db.prepare('INSERT INTO admins (username, password_hash) VALUES (?, ?)').run('admin', 'admin');
}

// Create default classes if none exist
const classCount = db.prepare('SELECT COUNT(*) as count FROM classes').get().count;
if (classCount === 0) {
  const gradesUpper = [5, 6, 7, 8];
  const sectionsUpper = ['A', 'B', 'C'];
  const gradesHighSchool = [9, 10, 11, 12];
  const sectionsHighSchool = ['A', 'B'];
  const insertClass = db.prepare('INSERT INTO classes (grade, section, category) VALUES (?, ?, ?)');
  
  db.transaction(() => {
    for (const grade of gradesUpper) {
      for (const section of sectionsUpper) {
        insertClass.run(grade, section, 'Felső Tagozat');
      }
    }
    for (const grade of gradesHighSchool) {
      for (const section of sectionsHighSchool) {
        insertClass.run(grade, section, 'Gimnázium');
      }
    }
  })();
  console.log('Default classes created with categories.');
}

export default db; 