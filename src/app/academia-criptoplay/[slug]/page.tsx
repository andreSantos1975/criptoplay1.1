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
  const permissions = session?.user?.permissions;

  const allLessons = getSortedCourseData();
  const lessonData = allLessons.find((l) => l.slug === params.slug);

  if (!lessonData) {
    notFound();
  }

  // Lógica de proteção do lado do servidor
  const hasCourseAccess = permissions?.hasCourseAccess ?? false;
  const lessonId = lessonData.order;
  
  // Se o usuário não tiver acesso ao curso E o módulo for além dos 2 primeiros, redireciona
  if (!hasCourseAccess && lessonId > 2) {
    redirect("/precos");
  }

  // Obter o conteúdo HTML, que pode ser uma operação async
  const fullLessonData = await getCourseData(params.slug);

  // Encontrar a próxima lição
  const currentIndex = allLessons.findIndex((l) => l.slug === params.slug);
  const nextLesson = allLessons[currentIndex + 1];

  let progress = null;
  if (session?.user) {
    progress = await prisma.userProgress.findUnique({
      where: {
        userId_slug: {
          userId: session.user.id,
          slug: params.slug,
        },
      },
    });
  }

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
            <h1 className={styles.title}>{fullLessonData.title}</h1>
            <div className={styles.meta}>
              Módulo {fullLessonData.order} • Leitura estimada: 5 min
            </div>
          </header>

          <article 
            className={styles.content}
            dangerouslySetInnerHTML={{ __html: fullLessonData.contentHtml }} 
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
