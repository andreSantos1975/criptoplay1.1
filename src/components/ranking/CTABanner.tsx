import { Button } from "@/components/ui/button";
import { Crown, Sparkles, ArrowRight } from "lucide-react";
import styles from "@/app/ranking/ranking.module.css";

interface CTABannerProps {
  type: "not-logged" | "free" | "starter";
}

export function CTABanner({ type }: CTABannerProps) {
  const content = {
    "not-logged": {
      title: "Quer aparecer aqui?",
      description: "Entre no ranking e compare sua performance com os melhores traders da comunidade CriptoPlay.",
      cta: "Assine o Pro",
      icon: Crown,
    },
    "free": {
      title: "Exiba sua performance com o Pro",
      description: "Desbloqueie seu nickname personalizado e apareça no ranking público para ganhar reconhecimento.",
      cta: "Upgrade para Pro",
      icon: Sparkles,
    },
    "starter": {
      title: "Desbloqueie seu potencial",
      description: "Membros Pro têm acesso a visibilidade pública, badges exclusivos e destaque na comunidade.",
      cta: "Fazer Upgrade",
      icon: Crown,
    },
  };

  const { title, description, cta, icon: Icon } = content[type];

  return (
    <div className={styles.ctaBanner}>
      {/* Background decoration handled by CSS or SVG if needed */}
      
      <div className={styles.ctaContent}>
        <div className={styles.ctaIconBox}>
          <Icon className="h-8 w-8" />
        </div>
        
        <div className={styles.ctaText}>
          <h3 className="text-lg font-bold text-gray-900">{title}</h3>
          <p className="text-sm text-gray-500 mt-1">{description}</p>
        </div>
        
        <Button size="lg" className="group">
          {cta}
          <ArrowRight className="h-4 w-4 ml-2 transition-transform group-hover:translate-x-1" />
        </Button>
      </div>
    </div>
  );
}
