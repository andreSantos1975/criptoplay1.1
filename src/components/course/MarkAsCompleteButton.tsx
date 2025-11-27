"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

interface MarkAsCompleteButtonProps {
  slug: string;
  allPosts: { slug: string }[];
}

export default function MarkAsCompleteButton({ slug, allPosts }: MarkAsCompleteButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const router = useRouter();

  const handleClick = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ slug }),
      });

      if (response.ok) {
        setIsCompleted(true);
        
        const currentIndex = allPosts.findIndex(p => p.slug === slug);
        const nextPost = allPosts[currentIndex + 1];
        
        if (nextPost) {
          setTimeout(() => {
            router.push(`/curso/${nextPost.slug}`);
          }, 1200); // Slightly longer delay to read the "Concluído" message
        } else {
            setTimeout(() => {
                router.push('/curso');
              }, 1200);
        }

      } else {
        console.error('Failed to mark as complete');
        setIsLoading(false); // Re-enable button on failure
      }
    } catch (error) {
      console.error('An error occurred:', error);
      setIsLoading(false); // Re-enable button on failure
    }
  };

  return (
    <div style={{ marginTop: '2rem', textAlign: 'center' }}>
        <Button 
            onClick={handleClick} 
            disabled={isLoading || isCompleted} 
            variant="cta"
            size="lg"
        >
            {isCompleted ? '✔️ Concluído! Redirecionando...' : (isLoading ? 'Salvando...' : 'Marcar como Concluído e Avançar')}
        </Button>
    </div>
  );
}
