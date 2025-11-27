"use client";

import Link from 'next/link';
import styles from '@/app/curso/CoursePage.module.css'; // Re-using styles
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

interface PostData {
  slug: string;
  title: string;
  order: number;
}

interface Progress {
  slug: string;
  completed: boolean;
}

interface CourseListProps {
  allPostsData: PostData[];
}

export default function CourseList({ allPostsData }: CourseListProps) {
  const { status } = useSession();
  const [progress, setProgress] = useState<Progress[]>([]);

  useEffect(() => {
    if (status === 'authenticated') {
      fetch('/api/progress')
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) {
            setProgress(data);
          }
        })
        .catch(console.error);
    }
  }, [status]);

  const isCompleted = (slug: string) => {
    const entry = progress.find((p) => p.slug === slug);
    return entry?.completed ?? false;
  };

  return (
    <div className={styles.courseListContainer}>
      <ol className={styles.courseList}>
        {allPostsData.map(({ slug, title }) => (
          <li key={slug} className={`${styles.courseListItem} ${isCompleted(slug) ? styles.completed : ''}`}>
            <Link href={`/curso/${slug}`} className={styles.courseLink}>
              {title}
            </Link>
            {isCompleted(slug) && <span className={styles.checkmark}>✔️</span>}
          </li>
        ))}
      </ol>
    </div>
  );
}
