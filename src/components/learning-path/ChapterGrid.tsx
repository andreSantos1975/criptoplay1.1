"use client";

import { ChapterCard } from "./ChapterCard";
import { Chapter } from "./chaptersData";
import styles from "./ChapterGrid.module.css";

interface ChapterGridProps {
  chapters: Chapter[];
}

export function ChapterGrid({ chapters }: ChapterGridProps) {
  const activeChapters = chapters.filter((c) => c.status !== "coming");
  const comingChapters = chapters.filter((c) => c.status === "coming");

  return (
    <section className={styles.section}>
      <div className={styles.container}>
        {/* Active chapters section */}
        <div className={styles.activeSection}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.title}>
              Módulos Disponíveis
            </h2>
            <p className={styles.subtitle}>
              {activeChapters.length} módulos prontos para você começar sua jornada
            </p>
          </div>

          <div className={styles.grid}>
            {activeChapters.map((chapter, index) => (
              <ChapterCard
                key={chapter.id}
                chapter={chapter}
                index={index}
              />
            ))}
          </div>
        </div>

        {/* Coming soon section */}
        {comingChapters.length > 0 && (
          <div className={styles.comingSoonSection}>
            <div className={styles.sectionHeader}>
              <div className={styles.roadmapBadge}>
                <span className={styles.pingWrapper}>
                  <span className={styles.pingAnimation} />
                  <span className={styles.pingDot} />
                </span>
                Roadmap educacional
              </div>
              <h2 className={styles.title}>
                Próximos Módulos
              </h2>
              <p className={styles.subtitle}>
                Conteúdos em produção para expandir sua jornada
              </p>
            </div>

            <div className={styles.grid}>
              {comingChapters.map((chapter, index) => (
                <ChapterCard
                  key={chapter.id}
                  chapter={chapter}
                  index={index + activeChapters.length}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
