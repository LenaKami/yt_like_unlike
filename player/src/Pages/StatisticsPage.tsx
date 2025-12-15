import { useState } from 'react';
import { ChartBarIcon, CheckCircleIcon, ClockIcon } from '@heroicons/react/24/solid';

type DayStats = {
  day: string;
  completed: number;
  total: number;
};

export const StatisticsPage = () => {
  // Mockowane dane
  const [weekStats] = useState<DayStats[]>([
    { day: 'Pon', completed: 3, total: 4 },
    { day: 'Wt', completed: 2, total: 3 },
    { day: 'Śr', completed: 4, total: 4 },
    { day: 'Czw', completed: 1, total: 2 },
    { day: 'Pt', completed: 2, total: 2 },
    { day: 'Sob', completed: 0, total: 0 },
    { day: 'Ndz', completed: 0, total: 0 },
  ]);

  const totalTasks = weekStats.reduce((sum, day) => sum + day.total, 0);
  const completedTasks = weekStats.reduce((sum, day) => sum + day.completed, 0);
  const percentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const maxTasks = Math.max(...weekStats.map(d => d.total), 1);

  return (
    <div className="login-box container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6 text-slate-900 dark:text-slate-100">Statystyki</h1>

      {/* Podsumowanie */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="login-box p-6 rounded-lg shadow">
          <div className="flex items-center gap-3 mb-2">
            <ClockIcon className="w-8 h-8 text-blue-500" />
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Zaplanowane</h3>
          </div>
          <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">{totalTasks}</p>
          <p className="text-sm text-slate-600 dark:text-slate-400">zadań w tym tygodniu</p>
        </div>

        <div className="login-box p-6 rounded-lg shadow">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircleIcon className="w-8 h-8 text-green-500" />
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Wykonane</h3>
          </div>
          <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">{completedTasks}</p>
          <p className="text-sm text-slate-600 dark:text-slate-400">zadań ukończonych</p>
        </div>

        <div className="login-box p-6 rounded-lg shadow">
          <div className="flex items-center gap-3 mb-2">
            <ChartBarIcon className="w-8 h-8 text-orange-500" />
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Postęp</h3>
          </div>
          <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">{percentage}%</p>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {completedTasks} / {totalTasks} zadań
          </p>
        </div>
      </div>

      {/* Wykres słupkowy */}
      <div className="login-box p-6 rounded-lg shadow mb-6">
        <h2 className="text-xl font-bold mb-6 text-slate-900 dark:text-slate-100">
          📊 Zadania w tym tygodniu
        </h2>
        <div className="flex items-end justify-around gap-2 h-64">
          {weekStats.map((day, index) => {
            const completedHeight = (day.completed / maxTasks) * 100;
            const totalHeight = (day.total / maxTasks) * 100;
            
            return (
              <div key={index} className="flex flex-col items-center flex-1">
                <div className="relative w-full h-48 flex flex-col justify-end gap-1">
                  {/* Słupek - wszystkie zadania */}
                  <div 
                    className="w-full bg-slate-300 dark:bg-slate-600 rounded-t transition-all duration-300"
                    style={{ height: `${totalHeight}%` }}
                  >
                    {/* Słupek - wykonane zadania */}
                    <div 
                      className="w-full bg-green-500 rounded-t transition-all duration-300"
                      style={{ height: `${day.total > 0 ? (day.completed / day.total) * 100 : 0}%` }}
                    ></div>
                  </div>
                  
                  {/* Liczby nad słupkiem */}
                  {day.total > 0 && (
                    <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {day.completed}/{day.total}
                    </div>
                  )}
                </div>
                
                {/* Dzień tygodnia */}
                <div className="mt-2 text-sm font-medium text-slate-900 dark:text-slate-100">
                  {day.day}
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Legenda */}
        <div className="flex justify-center gap-6 mt-6">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded"></div>
            <span className="text-sm text-slate-900 dark:text-slate-100">Wykonane</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-slate-300 dark:bg-slate-600 rounded"></div>
            <span className="text-sm text-slate-900 dark:text-slate-100">Pozostałe</span>
          </div>
        </div>
      </div>

      {/* Wykres kołowy */}
      <div className="login-box p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-6 text-slate-900 dark:text-slate-100">
          🥧 Podsumowanie tygodnia
        </h2>
        <div className="flex flex-col md:flex-row items-center justify-around gap-8">
          {/* Wykres kołowy (prosty SVG) */}
          <div className="relative">
            <svg width="200" height="200" viewBox="0 0 200 200" className="transform -rotate-90">
              {/* Tło - szary okrąg */}
              <circle
                cx="100"
                cy="100"
                r="80"
                fill="none"
                stroke="rgb(203 213 225)"
                strokeWidth="40"
                className="dark:stroke-slate-600"
              />
              {/* Wykonane - zielony okrąg */}
              <circle
                cx="100"
                cy="100"
                r="80"
                fill="none"
                stroke="rgb(34 197 94)"
                strokeWidth="40"
                strokeDasharray={`${(completedTasks / totalTasks) * 502.65} 502.65`}
                strokeLinecap="round"
              />
            </svg>
            {/* Procent w środku */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-4xl font-bold text-slate-900 dark:text-slate-100">{percentage}%</div>
                <div className="text-sm text-slate-600 dark:text-slate-400">ukończono</div>
              </div>
            </div>
          </div>

          {/* Statystyki tekstowe */}
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-6 h-6 bg-green-500 rounded"></div>
              <div>
                <div className="font-semibold text-slate-900 dark:text-slate-100">Wykonane</div>
                <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {completedTasks} zadań
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-6 h-6 bg-slate-300 dark:bg-slate-600 rounded"></div>
              <div>
                <div className="font-semibold text-slate-900 dark:text-slate-100">Niewykonane</div>
                <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {totalTasks - completedTasks} zadań
                </div>
              </div>
            </div>
            <div className="pt-4 border-t border-slate-300 dark:border-slate-600">
              <div className="text-sm text-slate-600 dark:text-slate-400">Ten tydzień:</div>
              <div className="text-xl font-bold text-slate-900 dark:text-slate-100">
                {completedTasks} / {totalTasks} zadań wykonanych ({percentage}%)
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
