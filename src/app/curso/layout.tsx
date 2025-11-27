import { getSortedCourseData } from '@/lib/course';
import Link from 'next/link';
import styles from './CourseLayout.module.css';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';

export default async function CourseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  const allChapters = getSortedCourseData();

  return (
    <div className={styles.container}>
      <aside className={styles.sidebar}>
        <h2>Jornada Cripto</h2>
        <ul className={styles.navList}>
          {allChapters.map(({ slug, title, order }) => (
            <li key={slug} className={styles.navItem}>
              <Link href={`/curso/${slug}`} className={styles.navLink}>
                {order}. {title}
              </Link>
            </li>
          ))}
        </ul>
      </aside>
      <main className={styles.content}>
        {children}
      </main>
    </div>
  );
}
