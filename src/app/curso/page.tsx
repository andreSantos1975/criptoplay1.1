import { getSortedCourseData } from '@/lib/course';
import styles from './CoursePage.module.css';
import CourseList from '@/components/course/CourseList';

export default function CoursePage() {
  const allPostsData = getSortedCourseData();

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Jornada Cripto</h1>
      <p className={styles.subtitle}>
        Sua trilha de conhecimento para dominar o universo das criptomoedas. Comece pelo primeiro capítulo e avance no seu ritmo.
      </p>
      <CourseList allPostsData={allPostsData} />
    </div>
  );
}
