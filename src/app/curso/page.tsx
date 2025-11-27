import Link from 'next/link';
import { getSortedCourseData } from '@/lib/course';
import styles from './CoursePage.module.css';

export default function CoursePage() {
  const allPostsData = getSortedCourseData();

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Jornada Cripto</h1>
      <p className={styles.subtitle}>
        Sua trilha de conhecimento para dominar o universo das criptomoedas. Comece pelo primeiro capítulo e avance no seu ritmo.
      </p>
      <div className={styles.courseListContainer}>
        <ol className={styles.courseList}>
          {allPostsData.map(({ slug, title }) => (
            <li key={slug} className={styles.courseListItem}>
              <Link href={`/curso/${slug}`} className={styles.courseLink}>
                {title}
              </Link>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}