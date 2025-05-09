import { json, LoaderFunction } from "@remix-run/node";
import { useLoaderData, Link, useSearchParams } from "@remix-run/react";
import { requireUserId } from "~/session.server";
import { useState, useEffect } from "react";

type TaskPriority = "Haute" | "Moyenne" | "Basse" | "Critique";
type TaskStatus = "À faire" | "En cours" | "En révision" | "Terminé" | "En attente";

type Task = {
  id: string;
  title: string;
  description: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate: string | null;
  projectId: string;
  projectName: string;
  assignees: Array<{
    id: string;
    email: string;
  }>;
  createdAt: string;
  updatedAt: string;
};

// Données simulées pour les tâches
const mockTasks: Task[] = [
  {
    id: "task1",
    title: "Concevoir la maquette",
    description: "Créer les maquettes UI/UX pour l'application mobile",
    priority: "Haute",
    status: "À faire",
    dueDate: "2025-05-15",
    projectId: "project1",
    projectName: "Application Mobile",
    assignees: [{ id: "user1", email: "designer@example.com" }],
    createdAt: "2025-05-01T10:00:00Z",
    updatedAt: "2025-05-01T10:00:00Z"
  },
  {
    id: "task2",
    title: "Préparer le backlog",
    description: "Définir les user stories pour le sprint",
    priority: "Moyenne",
    status: "En cours",
    dueDate: "2025-05-10",
    projectId: "project1",
    projectName: "Application Mobile",
    assignees: [{ id: "user2", email: "pm@example.com" }],
    createdAt: "2025-05-02T09:30:00Z",
    updatedAt: "2025-05-03T14:20:00Z"
  },
  {
    id: "task3",
    title: "Développer l'API",
    description: "Créer les endpoints REST pour l'authentification",
    priority: "Critique",
    status: "En cours",
    dueDate: "2025-05-20",
    projectId: "project2",
    projectName: "Refonte Site Web",
    assignees: [
      { id: "user3", email: "dev@example.com" },
      { id: "user4", email: "backend@example.com" }
    ],
    createdAt: "2025-05-03T11:15:00Z",
    updatedAt: "2025-05-05T16:45:00Z"
  },
  {
    id: "task4",
    title: "Configuration du projet",
    description: "Initialiser le projet Remix et configurer les dépendances",
    priority: "Haute",
    status: "Terminé",
    dueDate: "2025-05-05",
    projectId: "project2",
    projectName: "Refonte Site Web",
    assignees: [{ id: "user3", email: "dev@example.com" }],
    createdAt: "2025-04-28T08:00:00Z",
    updatedAt: "2025-05-01T17:30:00Z"
  },
  {
    id: "task5",
    title: "Analyse de la concurrence",
    description: "Étudier les solutions concurrentes et identifier les opportunités",
    priority: "Basse",
    status: "En attente",
    dueDate: "2025-05-30",
    projectId: "project3",
    projectName: "Projet Marketing Q2",
    assignees: [{ id: "user5", email: "marketing@example.com" }],
    createdAt: "2025-05-04T13:20:00Z",
    updatedAt: "2025-05-04T13:20:00Z"
  },
  {
    id: "task6",
    title: "Préparation des visuels",
    description: "Créer les visuels pour la campagne marketing",
    priority: "Moyenne",
    status: "À faire",
    dueDate: "2025-05-25",
    projectId: "project3",
    projectName: "Projet Marketing Q2",
    assignees: [{ id: "user6", email: "designer2@example.com" }],
    createdAt: "2025-05-05T09:10:00Z",
    updatedAt: "2025-05-05T09:10:00Z"
  }
];

export const loader: LoaderFunction = async ({ request }) => {
  await requireUserId(request);
  
  // Simuler la récupération des tâches
  // À remplacer par une vraie requête à la base de données
  return json({ 
    tasks: mockTasks,
    priorities: ["Critique", "Haute", "Moyenne", "Basse"],
    statuses: ["À faire", "En cours", "En révision", "Terminé", "En attente"]
  });
};

export default function TasksManagement() {
  const { tasks: initialTasks, priorities, statuses } = useLoaderData<typeof loader>();
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get("search") || "");
  const [selectedPriority, setSelectedPriority] = useState(searchParams.get("priority") || "");
  const [selectedStatus, setSelectedStatus] = useState(searchParams.get("status") || "");
  const [selectedProject, setSelectedProject] = useState(searchParams.get("project") || "");
  
  // Extraire la liste des projets uniques à partir des tâches
  const projects = Array.from(new Set(tasks.map(task => task.projectId))).map(projectId => {
    const project = tasks.find(task => task.projectId === projectId);
    return {
      id: projectId,
      name: project?.projectName || ""
    };
  });
  
  // Mettre à jour les filtres quand les paramètres d'URL changent
  useEffect(() => {
    setSearchTerm(searchParams.get("search") || "");
    setSelectedPriority(searchParams.get("priority") || "");
    setSelectedStatus(searchParams.get("status") || "");
    setSelectedProject(searchParams.get("project") || "");
  }, [searchParams]);
  
  // Filtrer les tâches en fonction des critères de recherche et des filtres
  const filteredTasks = tasks.filter(task => {
    // Filtre par texte de recherche
    const matchesSearch = searchTerm 
      ? task.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
        (task.description && task.description.toLowerCase().includes(searchTerm.toLowerCase()))
      : true;
    
    // Filtre par priorité
    const matchesPriority = selectedPriority ? task.priority === selectedPriority : true;
    
    // Filtre par statut
    const matchesStatus = selectedStatus ? task.status === selectedStatus : true;
    
    // Filtre par projet
    const matchesProject = selectedProject ? task.projectId === selectedProject : true;
    
    return matchesSearch && matchesPriority && matchesStatus && matchesProject;
  });
  
  // Mettre à jour les paramètres d'URL quand les filtres changent
  const updateFilters = () => {
    const params = new URLSearchParams();
    
    if (searchTerm) params.set("search", searchTerm);
    if (selectedPriority) params.set("priority", selectedPriority);
    if (selectedStatus) params.set("status", selectedStatus);
    if (selectedProject) params.set("project", selectedProject);
    
    setSearchParams(params);
  };
  
  // Gérer le changement de priorité d'une tâche
  const handlePriorityChange = (taskId: string, newPriority: TaskPriority) => {
    setTasks(prevTasks => 
      prevTasks.map(task => 
        task.id === taskId 
          ? { ...task, priority: newPriority, updatedAt: new Date().toISOString() } 
          : task
      )
    );
  };
  
  // Gérer le changement de statut d'une tâche
  const handleStatusChange = (taskId: string, newStatus: TaskStatus) => {
    setTasks(prevTasks => 
      prevTasks.map(task => 
        task.id === taskId 
          ? { ...task, status: newStatus, updatedAt: new Date().toISOString() } 
          : task
      )
    );
  };
  
  // Obtenir la couleur de fond en fonction de la priorité
  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case "Critique": return "bg-red-100 text-red-800";
      case "Haute": return "bg-orange-100 text-orange-800";
      case "Moyenne": return "bg-yellow-100 text-yellow-800";
      case "Basse": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };
  
  // Obtenir la couleur de fond en fonction du statut
  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case "À faire": return "bg-blue-100 text-blue-800";
      case "En cours": return "bg-purple-100 text-purple-800";
      case "En révision": return "bg-amber-100 text-amber-800";
      case "Terminé": return "bg-emerald-100 text-emerald-800";
      case "En attente": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };
  
  return (
    <div className="p-4">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Gestion des tâches</h2>
        <p className="text-gray-600 mt-1">Gérez et suivez toutes vos tâches en un seul endroit</p>
      </div>
      
      {/* Filtres et recherche */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="lg:col-span-2">
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">Rechercher</label>
            <input
              type="text"
              id="search"
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Rechercher par titre ou description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div>
            <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">Priorité</label>
            <select
              id="priority"
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
            >
              <option value="">Toutes les priorités</option>
              {priorities.map((priority: TaskPriority) => (
                <option key={priority} value={priority}>{priority}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
            <select
              id="status"
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="">Tous les statuts</option>
              {statuses.map((status: TaskStatus) => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label htmlFor="project" className="block text-sm font-medium text-gray-700 mb-1">Projet</label>
            <select
              id="project"
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
            >
              <option value="">Tous les projets</option>
              {projects.map(project => (
                <option key={project.id} value={project.id}>{project.name}</option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="mt-4 flex justify-between">
          <button
            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            onClick={() => {
              setSearchTerm("");
              setSelectedPriority("");
              setSelectedStatus("");
              setSelectedProject("");
              setSearchParams({});
            }}
          >
            Réinitialiser les filtres
          </button>
          
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            onClick={updateFilters}
          >
            Appliquer les filtres
          </button>
        </div>
      </div>
      
      {/* Liste des tâches */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tâche
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Projet
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Priorité
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Échéance
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Assignés
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTasks.length > 0 ? (
                filteredTasks.map(task => (
                  <tr key={task.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <Link 
                          to={`/dashboard/tasks/${task.id}`}
                          className="text-blue-600 hover:text-blue-800 font-medium"
                        >
                          {task.title}
                        </Link>
                        {task.description && (
                          <p className="text-gray-500 text-sm truncate max-w-xs">
                            {task.description}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link 
                        to={`/dashboard/projects/${task.projectId}`}
                        className="text-gray-900 hover:text-blue-600"
                      >
                        {task.projectName}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="relative">
                        <button
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}
                          onClick={() => {
                            const dropdown = document.getElementById(`priority-dropdown-${task.id}`);
                            if (dropdown) {
                              dropdown.classList.toggle("hidden");
                            }
                          }}
                        >
                          {task.priority}
                          <svg className="ml-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                        
                        <div 
                          id={`priority-dropdown-${task.id}`}
                          className="hidden absolute z-10 mt-1 w-36 bg-white rounded-md shadow-lg"
                        >
                          <div className="py-1">
                            {priorities.map((priority: TaskPriority) => (
                              <button
                                key={priority}
                                className={`block w-full text-left px-4 py-2 text-sm ${task.priority === priority ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
                                onClick={() => {
                                  handlePriorityChange(task.id, priority);
                                  document.getElementById(`priority-dropdown-${task.id}`)?.classList.add("hidden");
                                }}
                              >
                                {priority}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="relative">
                        <button
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}
                          onClick={() => {
                            const dropdown = document.getElementById(`status-dropdown-${task.id}`);
                            if (dropdown) {
                              dropdown.classList.toggle("hidden");
                            }
                          }}
                        >
                          {task.status}
                          <svg className="ml-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                        
                        <div 
                          id={`status-dropdown-${task.id}`}
                          className="hidden absolute z-10 mt-1 w-36 bg-white rounded-md shadow-lg"
                        >
                          <div className="py-1">
                            {statuses.map((status: TaskStatus) => (
                              <button
                                key={status}
                                className={`block w-full text-left px-4 py-2 text-sm ${task.status === status ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
                                onClick={() => {
                                  handleStatusChange(task.id, status);
                                  document.getElementById(`status-dropdown-${task.id}`)?.classList.add("hidden");
                                }}
                              >
                                {status}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {task.dueDate ? (
                        <span className={`text-sm ${new Date(task.dueDate) < new Date() ? 'text-red-600 font-medium' : 'text-gray-700'}`}>
                          {new Date(task.dueDate).toLocaleDateString('fr-FR')}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-500">Non définie</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex -space-x-2">
                        {task.assignees.map(assignee => (
                          <div 
                            key={assignee.id}
                            className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs"
                            title={assignee.email}
                          >
                            {assignee.email.charAt(0).toUpperCase()}
                          </div>
                        ))}
                        <button className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-300">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link 
                        to={`/dashboard/tasks/${task.id}/edit`}
                        className="text-blue-600 hover:text-blue-800 mr-4"
                      >
                        Modifier
                      </Link>
                      <button className="text-red-600 hover:text-red-800">
                        Supprimer
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-gray-500">
                    <p className="text-lg">Aucune tâche trouvée</p>
                    <p className="text-sm mt-1">Essayez de modifier vos filtres ou créez une nouvelle tâche</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Bouton d'ajout de tâche */}
      <div className="mt-6 flex justify-end">
        <Link 
          to="/dashboard/tasks/new"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Nouvelle tâche
        </Link>
      </div>
    </div>
  );
}
