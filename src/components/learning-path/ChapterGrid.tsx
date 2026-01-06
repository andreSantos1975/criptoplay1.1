"use client";

import { ChapterCard } from "./ChapterCard";
import { Chapter } from "./chaptersData";
import styles from "./ChapterGrid.module.css";

interface ChapterGridProps {
  chapters: Chapter[];
}

export function ChapterGrid({ chapters }: ChapterGridProps) {
  const activeChapters = chapters.filter((c) => c.status !== "coming");
  const intermediateChapters = chapters.filter((c) => c.status === "coming" && c.category === "intermediate");
  const advancedChapters = chapters.filter((c) => c.status === "coming" && c.category === "advanced");

  return (
    <section className={styles.section}>
      <div className={styles.container}>
        {/* Active chapters section */}
        <div className={styles.activeSection}>
          <div className={styles.sectionHeader}>
            <div className={styles.roadmapBadge}>
                <span className={styles.pingWrapper}>
                  <span className={styles.pingAnimation} />
                  <span className={styles.pingDot} />
                </span>
                Jornada Iniciante
              </div>
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

        {/* Intermediate (Coming soon) section */}
        {intermediateChapters.length > 0 && (
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
              {intermediateChapters.map((chapter, index) => (
                <ChapterCard
                  key={chapter.id}
                  chapter={chapter}
                  index={index + activeChapters.length}
                />
              ))}
            </div>
          </div>
        )}

        {/* Advanced (Coming soon) section */}
        {advancedChapters.length > 0 && (
          <div className={styles.comingSoonSection}>
            <div className={styles.sectionHeader}>
              <div className={styles.roadmapBadge}>
                <span className={styles.pingWrapper}>
                  <span className={styles.pingAnimation} />
                  <span className={styles.pingDot} />
                </span>
                Nível Avançado
              </div>
              <h2 className={styles.title}>
                Mestria e Estratégias Profissionais
              </h2>
              <p className={styles.subtitle}>
                Conteúdos avançados para traders e investidores experientes
              </p>
            </div>

            <div className={styles.grid}>
              {advancedChapters.map((chapter, index) => (
                <ChapterCard
                  key={chapter.id}
                  chapter={chapter}
                  index={index + activeChapters.length + intermediateChapters.length}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
