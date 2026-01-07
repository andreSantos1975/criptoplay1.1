import { Info, CalendarClock, Skull } from "lucide-react";

export function RankingRules() {
  return (
    <div className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border border-slate-200 dark:border-slate-800 rounded-xl p-6 mt-8 mb-12">
      <div className="flex items-center gap-2 mb-6">
        <Info className="w-5 h-5 text-violet-600" />
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Regras da Competição</h3>
      </div>
      
      <div className="grid md:grid-cols-2 gap-6">
        {/* Regra 1: Reset Mensal */}
        <div className="flex gap-4 p-4 rounded-lg bg-white dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800/50 shadow-sm">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-xl h-fit">
            <CalendarClock className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">Temporadas Mensais</h4>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              O ranking reinicia automaticamente no <strong>dia 1º de cada mês</strong>. 
              Seu saldo acumulado é mantido, mas o cálculo de ROI (retorno) zera. 
              Isso garante que todos comecem a nova temporada com as mesmas chances de alcançar o topo.
            </p>
          </div>
        </div>

        {/* Regra 2: Falência */}
        <div className="flex gap-4 p-4 rounded-lg bg-white dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800/50 shadow-sm">
          <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-xl h-fit">
            <Skull className="w-6 h-6 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">Sistema de Falência</h4>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              O gerenciamento de risco é essencial. Se sua banca virtual for liquidada (chegar a zero), 
              você ficará <strong>suspenso até o dia 1º do próximo mês</strong>. 
              Somente na nova temporada sua banca será restaurada para o valor inicial.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
