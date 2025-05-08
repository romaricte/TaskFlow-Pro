import { json, LoaderFunction } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { requireUserId } from "~/session.server";
import { useState, useEffect, useRef } from "react";

type GanttTask = {
  id: string;
  name: string;
  start: string;
  end: string;
  progress: number;
  dependencies?: string[];
  assignees: string[];
  color?: string;
};

type GanttProject = {
  id: string;
  name: string;
  tasks: GanttTask[];
};

// Données simulées pour le diagramme de Gantt
const mockGanttData: GanttProject = {
  id: "1",
  name: "Refonte Site Web",
  tasks: [
    {
      id: "task1",
      name: "Analyse des besoins",
      start: "2025-05-01",
      end: "2025-05-10",
      progress: 100,
      assignees: ["user1"],
      color: "#4F46E5"
    },
    {
      id: "task2",
      name: "Conception UX/UI",
      start: "2025-05-10",
      end: "2025-05-25",
      progress: 70,
      dependencies: ["task1"],
      assignees: ["user2"],
      color: "#8B5CF6"
    },
    {
      id: "task3",
      name: "Développement Frontend",
      start: "2025-05-20",
      end: "2025-06-10",
      progress: 30,
      dependencies: ["task2"],
      assignees: ["user3", "user4"],
      color: "#EC4899"
    },
    {
      id: "task4",
      name: "Développement Backend",
      start: "2025-05-20",
      end: "2025-06-15",
      progress: 20,
      dependencies: ["task2"],
      assignees: ["user5"],
      color: "#10B981"
    },
    {
      id: "task5",
      name: "Tests et QA",
      start: "2025-06-10",
      end: "2025-06-25",
      progress: 0,
      dependencies: ["task3", "task4"],
      assignees: ["user6"],
      color: "#F59E0B"
    },
    {
      id: "task6",
      name: "Déploiement",
      start: "2025-06-25",
      end: "2025-06-30",
      progress: 0,
      dependencies: ["task5"],
      assignees: ["user3", "user5"],
      color: "#EF4444"
    }
  ]
};

export const loader: LoaderFunction = async ({ request }) => {
  await requireUserId(request);
  
  // Simuler la récupération des données du diagramme de Gantt
  // À remplacer par une vraie requête à la base de données
  return json({ project: mockGanttData });
};

// Composant pour afficher une barre de tâche dans le diagramme
const GanttBar = ({ 
  task, 
  startDate, 
  endDate, 
  width, 
  dayWidth, 
  onClick 
}: { 
  task: GanttTask; 
  startDate: Date; 
  endDate: Date; 
  width: number; 
  dayWidth: number; 
  onClick: (task: GanttTask) => void;
}) => {
  const taskStart = new Date(task.start);
  const taskEnd = new Date(task.end);
  
  // Calculer la position et la largeur de la barre
  const daysFromStart = Math.floor((taskStart.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const taskDuration = Math.ceil((taskEnd.getTime() - taskStart.getTime()) / (1000 * 60 * 60 * 24));
  
  const left = daysFromStart * dayWidth;
  const barWidth = taskDuration * dayWidth;
  
  return (
    <div 
      className="absolute h-8 rounded-md cursor-pointer hover:opacity-90 flex items-center px-2 text-white text-sm font-medium"
      style={{ 
        left: `${left}px`, 
        width: `${barWidth}px`, 
        backgroundColor: task.color || '#4F46E5',
        boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)'
      }}
      onClick={() => onClick(task)}
    >
      <div className="truncate">{task.name}</div>
      <div 
        className="absolute bottom-0 left-0 h-1 bg-white bg-opacity-30 rounded-b-md"
        style={{ width: `${task.progress}%` }}
      ></div>
    </div>
  );
};

// Composant pour afficher les dépendances entre les tâches
const DependencyLine = ({ 
  fromTask, 
  toTask, 
  tasks, 
  startDate, 
  dayWidth, 
  rowHeight 
}: { 
  fromTask: string; 
  toTask: string; 
  tasks: GanttTask[]; 
  startDate: Date; 
  dayWidth: number; 
  rowHeight: number;
}) => {
  const from = tasks.find(t => t.id === fromTask);
  const to = tasks.find(t => t.id === toTask);
  
  if (!from || !to) return null;
  
  const fromIndex = tasks.findIndex(t => t.id === fromTask);
  const toIndex = tasks.findIndex(t => t.id === toTask);
  
  const fromDate = new Date(from.end);
  const toDate = new Date(to.start);
  
  const fromDaysFromStart = Math.floor((fromDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const toDaysFromStart = Math.floor((toDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  
  const fromX = fromDaysFromStart * dayWidth;
  const toX = toDaysFromStart * dayWidth;
  
  const fromY = (fromIndex * rowHeight) + (rowHeight / 2);
  const toY = (toIndex * rowHeight) + (rowHeight / 2);
  
  // Créer un chemin SVG pour la ligne de dépendance
  const path = `M ${fromX} ${fromY} C ${(fromX + toX) / 2} ${fromY}, ${(fromX + toX) / 2} ${toY}, ${toX} ${toY}`;
  
  return (
    <path 
      d={path} 
      stroke="#CBD5E1" 
      strokeWidth="1.5" 
      fill="none" 
      strokeDasharray="4 2"
      markerEnd="url(#arrowhead)"
    />
  );
};

// Composant principal pour le diagramme de Gantt
export default function GanttChart() {
  const { project } = useLoaderData<typeof loader>();
  const [ganttData, setGanttData] = useState<GanttProject>(project);
  const [selectedTask, setSelectedTask] = useState<GanttTask | null>(null);
  const [timeScale, setTimeScale] = useState<'day' | 'week' | 'month'>('day');
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  
  // Calculer les dates de début et de fin du projet
  const startDate = new Date(Math.min(...ganttData.tasks.map(task => new Date(task.start).getTime())));
  const endDate = new Date(Math.max(...ganttData.tasks.map(task => new Date(task.end).getTime())));
  
  // Ajouter quelques jours de marge
  startDate.setDate(startDate.getDate() - 2);
  endDate.setDate(endDate.getDate() + 2);
  
  // Calculer le nombre total de jours
  const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  
  // Définir la largeur d'un jour en fonction de l'échelle de temps
  const dayWidth = timeScale === 'day' ? 40 : timeScale === 'week' ? 20 : 10;
  
  // Hauteur de chaque ligne de tâche
  const rowHeight = 50;
  
  // Mettre à jour la largeur du conteneur quand la fenêtre est redimensionnée
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };
    
    updateWidth();
    window.addEventListener('resize', updateWidth);
    
    return () => {
      window.removeEventListener('resize', updateWidth);
    };
  }, []);
  
  // Générer les dates pour l'en-tête du diagramme
  const generateTimelineHeader = () => {
    const dates = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      dates.push(new Date(currentDate));
      
      if (timeScale === 'day') {
        currentDate.setDate(currentDate.getDate() + 1);
      } else if (timeScale === 'week') {
        currentDate.setDate(currentDate.getDate() + 7);
      } else {
        currentDate.setMonth(currentDate.getMonth() + 1);
      }
    }
    
    return dates;
  };
  
  const timelineHeader = generateTimelineHeader();
  
  // Formater les dates selon l'échelle de temps
  const formatDate = (date: Date) => {
    if (timeScale === 'day') {
      return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    } else if (timeScale === 'week') {
      return `S${Math.ceil((date.getDate() + new Date(date.getFullYear(), date.getMonth(), 1).getDay()) / 7)}`;
    } else {
      return date.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' });
    }
  };
  
  // Gérer le clic sur une tâche
  const handleTaskClick = (task: GanttTask) => {
    setSelectedTask(task);
  };
  
  // Fermer le modal de détails de tâche
  const closeTaskDetails = () => {
    setSelectedTask(null);
  };
  
  return (
    <div className="p-4">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">{ganttData.name} - Diagramme de Gantt</h2>
        <div className="flex mt-4 space-x-2">
          <div className="flex border border-gray-300 rounded-md overflow-hidden">
            <button 
              className={`px-4 py-2 ${timeScale === 'day' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'}`}
              onClick={() => setTimeScale('day')}
            >
              Jour
            </button>
            <button 
              className={`px-4 py-2 ${timeScale === 'week' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'}`}
              onClick={() => setTimeScale('week')}
            >
              Semaine
            </button>
            <button 
              className={`px-4 py-2 ${timeScale === 'month' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'}`}
              onClick={() => setTimeScale('month')}
            >
              Mois
            </button>
          </div>
          <button className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50">
            Exporter
          </button>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="flex">
          {/* Colonne des noms de tâches */}
          <div className="w-64 shrink-0 border-r border-gray-200">
            <div className="h-12 border-b border-gray-200 bg-gray-50 flex items-center px-4 font-medium text-gray-700">
              Tâches
            </div>
            {ganttData.tasks.map((task, index) => (
              <div 
                key={task.id} 
                className="h-12 flex items-center px-4 border-b border-gray-200"
                style={{ height: `${rowHeight}px` }}
              >
                <div className="truncate">{task.name}</div>
              </div>
            ))}
          </div>
          
          {/* Diagramme de Gantt */}
          <div 
            ref={containerRef}
            className="overflow-x-auto flex-1"
            style={{ overflowY: 'hidden' }}
          >
            <div style={{ width: `${totalDays * dayWidth}px`, minWidth: '100%' }}>
              {/* En-tête du diagramme */}
              <div className="h-12 border-b border-gray-200 bg-gray-50 flex">
                {timelineHeader.map((date, index) => (
                  <div 
                    key={index} 
                    className="border-r border-gray-200 flex items-center justify-center text-sm text-gray-600"
                    style={{ 
                      width: `${dayWidth}px`, 
                      minWidth: `${dayWidth}px` 
                    }}
                  >
                    {formatDate(date)}
                  </div>
                ))}
              </div>
              
              {/* Corps du diagramme */}
              <div style={{ position: 'relative' }}>
                {/* Lignes horizontales pour chaque tâche */}
                {ganttData.tasks.map((task, index) => (
                  <div 
                    key={task.id} 
                    className="border-b border-gray-200"
                    style={{ height: `${rowHeight}px` }}
                  >
                    {/* Lignes verticales pour les jours */}
                    <div className="absolute top-0 left-0 h-full w-full">
                      {timelineHeader.map((date, dateIndex) => (
                        <div 
                          key={dateIndex}
                          className="absolute top-0 h-full border-r border-gray-100"
                          style={{ 
                            left: `${dateIndex * dayWidth}px`,
                            width: `${dayWidth}px`
                          }}
                        ></div>
                      ))}
                    </div>
                  </div>
                ))}
                
                {/* Barres de tâches */}
                {ganttData.tasks.map((task, index) => (
                  <div 
                    key={task.id} 
                    style={{ 
                      position: 'absolute', 
                      top: `${index * rowHeight}px`, 
                      height: `${rowHeight}px`,
                      width: '100%'
                    }}
                  >
                    <GanttBar 
                      task={task} 
                      startDate={startDate} 
                      endDate={endDate} 
                      width={containerWidth} 
                      dayWidth={dayWidth}
                      onClick={handleTaskClick}
                    />
                  </div>
                ))}
                
                {/* Lignes de dépendances */}
                <svg 
                  style={{ 
                    position: 'absolute', 
                    top: 0, 
                    left: 0, 
                    width: '100%', 
                    height: `${ganttData.tasks.length * rowHeight}px`,
                    pointerEvents: 'none'
                  }}
                >
                  <defs>
                    <marker 
                      id="arrowhead" 
                      markerWidth="10" 
                      markerHeight="7" 
                      refX="9" 
                      refY="3.5" 
                      orient="auto"
                    >
                      <polygon points="0 0, 10 3.5, 0 7" fill="#CBD5E1" />
                    </marker>
                  </defs>
                  
                  {ganttData.tasks.map(task => 
                    task.dependencies?.map(depId => (
                      <DependencyLine 
                        key={`${depId}-${task.id}`}
                        fromTask={depId}
                        toTask={task.id}
                        tasks={ganttData.tasks}
                        startDate={startDate}
                        dayWidth={dayWidth}
                        rowHeight={rowHeight}
                      />
                    ))
                  )}
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Modal de détails de tâche */}
      {selectedTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800">{selectedTask.name}</h3>
              <button 
                className="text-gray-500 hover:text-gray-700"
                onClick={closeTaskDetails}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Période</p>
                <p className="font-medium">
                  {new Date(selectedTask.start).toLocaleDateString('fr-FR')} - {new Date(selectedTask.end).toLocaleDateString('fr-FR')}
                </p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500">Progression</p>
                <div className="w-full bg-gray-200 rounded-full h-2.5 mt-1">
                  <div 
                    className="bg-blue-600 h-2.5 rounded-full" 
                    style={{ width: `${selectedTask.progress}%` }}
                  ></div>
                </div>
                <p className="text-right text-xs text-gray-500 mt-1">{selectedTask.progress}%</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500">Assignés</p>
                <div className="flex mt-1 space-x-1">
                  {selectedTask.assignees.map(userId => (
                    <div 
                      key={userId}
                      className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white"
                    >
                      {userId.charAt(0).toUpperCase()}
                    </div>
                  ))}
                </div>
              </div>
              
              {selectedTask.dependencies && selectedTask.dependencies.length > 0 && (
                <div>
                  <p className="text-sm text-gray-500">Dépendances</p>
                  <div className="mt-1">
                    {selectedTask.dependencies.map(depId => {
                      const dep = ganttData.tasks.find(t => t.id === depId);
                      return dep ? (
                        <span 
                          key={depId}
                          className="inline-block bg-gray-100 rounded-full px-3 py-1 text-sm font-medium text-gray-700 mr-2 mb-2"
                        >
                          {dep.name}
                        </span>
                      ) : null;
                    })}
                  </div>
                </div>
              )}
              
              <div className="pt-4 border-t border-gray-200 flex justify-end space-x-2">
                <button 
                  className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                  onClick={closeTaskDetails}
                >
                  Fermer
                </button>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                  Modifier
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
