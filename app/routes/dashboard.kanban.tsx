import { json, LoaderFunction } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { requireUserId } from "~/session.server";
import { useState, useEffect } from "react";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

type Board = {
  id: string;
  name: string;
  columns: Column[];
};

type Column = {
  id: string;
  name: string;
  position: number;
  color: string;
  tasks: Task[];
};

type Task = {
  id: string;
  title: string;
  description: string | null;
  priority: string;
  status: string;
  position: number;
  dueDate: string | null;
  assignees: { id: string; email: string }[];
};

// Simuler des données pour le tableau Kanban
const mockKanbanData: Board = {
  id: "1",
  name: "Tableau de développement",
  columns: [
    {
      id: "col1",
      name: "À faire",
      position: 0,
      color: "#E5E7EB",
      tasks: [
        {
          id: "task1",
          title: "Concevoir la maquette",
          description: "Créer les maquettes UI/UX pour l'application mobile",
          priority: "Haute",
          status: "À faire",
          position: 0,
          dueDate: "2025-05-15",
          assignees: [{ id: "user1", email: "designer@example.com" }]
        },
        {
          id: "task2",
          title: "Préparer le backlog",
          description: "Définir les user stories pour le sprint",
          priority: "Moyenne",
          status: "À faire",
          position: 1,
          dueDate: "2025-05-10",
          assignees: [{ id: "user2", email: "pm@example.com" }]
        }
      ]
    },
    {
      id: "col2",
      name: "En cours",
      position: 1,
      color: "#DBEAFE",
      tasks: [
        {
          id: "task3",
          title: "Développer l'API",
          description: "Créer les endpoints REST pour l'authentification",
          priority: "Haute",
          status: "En cours",
          position: 0,
          dueDate: "2025-05-20",
          assignees: [{ id: "user3", email: "dev@example.com" }]
        }
      ]
    },
    {
      id: "col3",
      name: "Révision",
      position: 2,
      color: "#FEF3C7",
      tasks: []
    },
    {
      id: "col4",
      name: "Terminé",
      position: 3,
      color: "#D1FAE5",
      tasks: [
        {
          id: "task4",
          title: "Configuration du projet",
          description: "Initialiser le projet Remix et configurer les dépendances",
          priority: "Haute",
          status: "Terminé",
          position: 0,
          dueDate: "2025-05-05",
          assignees: [{ id: "user3", email: "dev@example.com" }]
        }
      ]
    }
  ]
};

export const loader: LoaderFunction = async ({ request }) => {
  await requireUserId(request);
  
  // Simuler la récupération des données du tableau Kanban
  // À remplacer par une vraie requête à la base de données
  return json({ board: mockKanbanData });
};

// Composant pour une tâche (draggable)
const TaskCard = ({ task, columnId }: { task: Task; columnId: string }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'TASK',
    item: { id: task.id, fromColumnId: columnId },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging()
    })
  }));

  // Calculer la couleur de priorité
  const priorityColor = () => {
    switch (task.priority) {
      case 'Haute': return 'bg-red-100 text-red-800';
      case 'Moyenne': return 'bg-yellow-100 text-yellow-800';
      case 'Basse': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div
      ref={drag}
      className={`p-3 mb-2 bg-white rounded-md shadow-sm border-l-4 border-blue-500 cursor-move ${isDragging ? 'opacity-50' : ''}`}
    >
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-medium text-gray-900">{task.title}</h4>
        <span className={`text-xs px-2 py-1 rounded-full ${priorityColor()}`}>
          {task.priority}
        </span>
      </div>
      
      {task.description && (
        <p className="text-sm text-gray-600 mb-2 line-clamp-2">{task.description}</p>
      )}
      
      <div className="flex justify-between items-center mt-2">
        {task.dueDate && (
          <span className="text-xs text-gray-500">
            Échéance: {new Date(task.dueDate).toLocaleDateString('fr-FR')}
          </span>
        )}
        
        <div className="flex -space-x-2">
          {task.assignees.map(assignee => (
            <div 
              key={assignee.id}
              className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs"
              title={assignee.email}
            >
              {assignee.email.charAt(0).toUpperCase()}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Composant pour une colonne (droppable)
const Column = ({ column, onDrop }: { column: Column; onDrop: (taskId: string, fromColumnId: string, toColumnId: string) => void }) => {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'TASK',
    drop: (item: { id: string; fromColumnId: string }) => {
      onDrop(item.id, item.fromColumnId, column.id);
      return { columnId: column.id };
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver()
    })
  }));

  return (
    <div 
      className="flex flex-col w-72 shrink-0 bg-gray-100 rounded-md p-2"
      style={{ borderTop: `3px solid ${column.color}` }}
    >
      <div className="flex justify-between items-center mb-2 p-2">
        <h3 className="font-medium text-gray-800">{column.name}</h3>
        <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded-full">
          {column.tasks.length}
        </span>
      </div>
      
      <div 
        ref={drop}
        className={`flex-1 min-h-[200px] transition-colors ${isOver ? 'bg-blue-50' : ''}`}
      >
        {column.tasks.map(task => (
          <TaskCard key={task.id} task={task} columnId={column.id} />
        ))}
        
        <button className="w-full mt-2 p-2 text-sm text-gray-500 hover:bg-gray-200 rounded flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Ajouter une tâche
        </button>
      </div>
    </div>
  );
};

export default function KanbanBoard() {
  const { board } = useLoaderData<typeof loader>();
  const [kanbanData, setKanbanData] = useState<Board>(board);

  // Mettre à jour l'état local quand les données du loader changent
  useEffect(() => {
    setKanbanData(board);
  }, [board]);

  // Gérer le déplacement d'une tâche
  const handleTaskMove = (taskId: string, fromColumnId: string, toColumnId: string) => {
    if (fromColumnId === toColumnId) return;

    setKanbanData(prevData => {
      // Créer une copie profonde des données
      const newData = JSON.parse(JSON.stringify(prevData)) as Board;
      
      // Trouver les colonnes source et destination
      const fromColumnIndex = newData.columns.findIndex(col => col.id === fromColumnId);
      const toColumnIndex = newData.columns.findIndex(col => col.id === toColumnId);
      
      if (fromColumnIndex === -1 || toColumnIndex === -1) return prevData;
      
      // Trouver la tâche à déplacer
      const taskIndex = newData.columns[fromColumnIndex].tasks.findIndex(task => task.id === taskId);
      if (taskIndex === -1) return prevData;
      
      // Récupérer la tâche et la supprimer de la colonne source
      const [task] = newData.columns[fromColumnIndex].tasks.splice(taskIndex, 1);
      
      // Mettre à jour le statut de la tâche
      task.status = newData.columns[toColumnIndex].name;
      
      // Ajouter la tâche à la colonne de destination
      newData.columns[toColumnIndex].tasks.push({
        ...task,
        position: newData.columns[toColumnIndex].tasks.length
      });
      
      return newData;
    });
  };

  return (
    <div className="p-4">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">{kanbanData.name}</h2>
        <div className="flex mt-4 space-x-2">
          <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
            Ajouter une colonne
          </button>
          <button className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50">
            Filtrer
          </button>
          <button className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50">
            Exporter
          </button>
        </div>
      </div>
      
      <DndProvider backend={HTML5Backend}>
        <div className="flex space-x-4 overflow-x-auto pb-4">
          {kanbanData.columns.map(column => (
            <Column 
              key={column.id} 
              column={column} 
              onDrop={handleTaskMove} 
            />
          ))}
        </div>
      </DndProvider>
    </div>
  );
}
