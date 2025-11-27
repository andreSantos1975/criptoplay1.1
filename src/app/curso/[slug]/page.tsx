import { getCourseData, getSortedCourseData } from '@/lib/course';
import styles from './Post.module.css';
import { notFound } from 'next/navigation';

export async function generateStaticParams() {
  const paths = getSortedCourseData();
  return paths.map(p => ({ slug: p.slug }));
}

export default async function Post({ params }: { params: { slug: string } }) {
  try {
    const postData = await getCourseData(params.slug);

    return (
      <article className={styles.post}>
        <h1>{postData.title}</h1>
        <div dangerouslySetInnerHTML={{ __html: postData.contentHtml }} />
      </article>
    );
  } catch (error) {
    notFound();
  }
}
