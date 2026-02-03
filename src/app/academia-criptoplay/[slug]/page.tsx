import { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getCourseData, getSortedCourseData } from "@/lib/course";
import { LessonActions } from "@/components/learning-path/LessonActions";
import styles from "./page.module.css";
import Navbar from "@/components/Navbar/Navbar";

import { hasActiveSubscription } from "@/lib/permissions";

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const lessonData = await getCourseData(params.slug);
    return {
      title: `${lessonData.title} | Academia CriptoPlay`,
      description: "Aula exclusiva da Academia CriptoPlay.",
    };
  } catch (error) {
    return {
      title: "Aula não encontrada",
    };
  }
}

export default async function LessonPage({ params }: Props) {
  const session = await getServerSession(authOptions);

  // Secure this page with the new, stricter permission check
  if (!hasActiveSubscription(session)) {
    // Redirect non-subscribers (including trial users) to the subscription page
    redirect("/assinatura?reason=course_access");
  }

  let lessonData;
  try {
    lessonData = await getCourseData(params.slug);
  } catch (error) {
    notFound();
  }

  // Find next lesson
  const allLessons = getSortedCourseData();
  const currentIndex = allLessons.findIndex((l) => l.slug === params.slug);
  const nextLesson = allLessons[currentIndex + 1];

  // Although hasActiveSubscription should prevent session from being null here,
  // this check is needed to satisfy TypeScript.
  if (!session?.user) {
    // This should not be reached, but it's a safeguard.
    return redirect("/login");
  }

  // Check user progress for this specific lesson
  const progress = await prisma.userProgress.findUnique({
    where: {
      userId_slug: {
        userId: session.user.id,
        slug: params.slug,
      },
    },
  });

  return (
    <>
      <Navbar />
      <main className={styles.container}>
        <div style={{ marginTop: "80px" }}> {/* Spacer for fixed Navbar */}
          <Link href="/academia-criptoplay" className={styles.backLink}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para a Trilha
          </Link>
          
          <header className={styles.header}>
            <h1 className={styles.title}>{lessonData.title}</h1>
            <div className={styles.meta}>
              Módulo {lessonData.order} • Leitura estimada: 5 min
            </div>
          </header>

          <article 
            className={styles.content}
            dangerouslySetInnerHTML={{ __html: lessonData.contentHtml }} 
          />

          <LessonActions 
            slug={params.slug}
            nextSlug={nextLesson?.slug}
            isCompleted={!!progress?.completed}
          />
        </div>
      </main>
    </>
  );
}
