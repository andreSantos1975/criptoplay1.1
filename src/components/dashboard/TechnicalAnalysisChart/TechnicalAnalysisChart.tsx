import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import styles from './TechnicalAnalysisChart.module.css';

export const TechnicalAnalysisChart = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Análise Técnica</CardTitle>
      </CardHeader>
      <CardContent>
        <div className={styles.placeholder}>
          <p>Componente de Análise Técnica (Gráfico) em breve.</p>
        </div>
      </CardContent>
    </Card>
  );
};
