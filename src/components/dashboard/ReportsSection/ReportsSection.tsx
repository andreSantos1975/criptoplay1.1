import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import styles from './ReportsSection.module.css';

export const ReportsSection = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Relatórios</CardTitle>
      </CardHeader>
      <CardContent>
        <div className={styles.placeholder}>
          <p>Componente de Relatórios em breve.</p>
        </div>
      </CardContent>
    </Card>
  );
};
