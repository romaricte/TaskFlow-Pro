import { json, LoaderFunction } from "@remix-run/node";
import { Link, Outlet, useLoaderData } from "@remix-run/react";
import { requireUserId } from "~/session.server";
import { useState } from "react";

type Project = {
  id: string;
  name: string;
  description: string;
  status: string;
  startDate: string;
  endDate: string | null;
  progress: number;
  members: Array<{
    id: string;
    email: string;
    role: string;
  }>;
  tasksCount: {
    total: number;
    completed: number;
  };
};

// Données simulées pour les projets
const mockProjects: Project[] = [
  {
    id: "1",
    name: "Projet Marketing Q2",
    description: "Campagne marketing pour le deuxième trimestre 2025",
    status: "En cours",
    startDate: "2025-04-01",
    endDate: "2025-06-30",
    progress: 35,
    members: [
      { id: "user1", email: "marketing@example.com", role: "Chef de projet" },
      { id: "user2", email: "designer@example.com", role: "Designer" }
    ],
    tasksCount: {
      total: 12,
      completed: 4
    }
  },
  {
    id: "2",
    name: "Refonte Site Web",
    description: "Refonte complète du site web corporate avec Remix",
    status: "Planifié",
    startDate: "2025-05-15",
    endDate: "2025-07-30",
    progress: 10,
    members: [
      { id: "user3", email: "dev@example.com", role: "Développeur" },
      { id: "user4", email: "pm@example.com", role: "Chef de projet" },
      { id: "user5", email: "designer2@example.com", role: "Designer UX" }
    ],
    tasksCount: {
      total: 24,
      completed: 2
    }
  },
  {
    id: "3",
    name: "Application Mobile",
    description: "Développement d'une application mobile pour nos clients",
    status: "En cours",
    startDate: "2025-03-15",
    endDate: "2025-08-30",
    progress: 45,
    members: [
      { id: "user3", email: "dev@example.com", role: "Développeur" },
      { id: "user6", email: "mobile@example.com", role: "Développeur Mobile" },
      { id: "user7", email: "qa@example.com", role: "Testeur" }
    ],
    tasksCount: {
      total: 36,
      completed: 16
    }
  },
  {
    id: "4",
    name: "Intégration CRM",
    description: "Intégration du nouveau système CRM avec nos outils existants",
    status: "En attente",
    startDate: "2025-06-01",
    endDate: null,
    progress: 0,
    members: [
      { id: "user8", email: "it@example.com", role: "Responsable IT" }
    ],
    tasksCount: {
      total: 8,
      completed: 0
    }
  }
];

export const loader: LoaderFunction = async ({ request }) => {
  await requireUserId(request);
  
  // Simuler la récupération des projets
  // À remplacer par une vraie requête à la base de données
  return json({ 
    projects: mockProjects,
    statuses: ["En cours", "Planifié", "Terminé", "En attente", "Annulé"]
  });
};

export default function ProjectsManagement() {
  const { projects, statuses } = useLoaderData<typeof loader>();
  const [filter, setFilter] = useState("all");
  
  // Filtrer les projets en fonction du statut sélectionné
  const filteredProjects = filter === "all" 
    ? projects 
    : projects.filter((project: Project) => project.status.toLowerCase() === filter.toLowerCase());
  
  // Obtenir la couleur de fond en fonction du statut
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "en cours": return "bg-blue-100 text-blue-800";
      case "planifié": return "bg-purple-100 text-purple-800";
      case "terminé": return "bg-green-100 text-green-800";
      case "en attente": return "bg-yellow-100 text-yellow-800";
      case "annulé": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };
  
  return (
    <div className="p-4">
      <Outlet />
      
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">Projets</h2>
          <Link 
            to="/dashboard/projects/new"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Nouveau projet
          </Link>
        </div>
        <p className="text-gray-600 mt-1">Gérez tous vos projets et suivez leur avancement</p>
      </div>
      
      {/* Filtres */}
      <div className="mb-6 flex space-x-2 overflow-x-auto pb-2">
        <button
          className={`px-4 py-2 rounded-md ${filter === "all" ? "bg-blue-600 text-white" : "bg-white text-gray-700 border border-gray-300"}`}
          onClick={() => setFilter("all")}
        >
          Tous
        </button>
        {statuses.map((status: string) => (
          <button
            key={status}
            className={`px-4 py-2 rounded-md ${filter === status.toLowerCase() ? "bg-blue-600 text-white" : "bg-white text-gray-700 border border-gray-300"}`}
            onClick={() => setFilter(status.toLowerCase())}
          >
            {status}
          </button>
        ))}
      </div>
      
      {/* Liste des projets */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProjects.map((project: Project) => (
          <Link 
            key={project.id}
            to={`/dashboard/projects/${project.id}`}
            className="bg-white rounded-lg shadow hover:shadow-md transition-shadow duration-200"
          >
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold text-gray-800">{project.name}</h3>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                  {project.status}
                </span>
              </div>
              
              <p className="text-gray-600 mb-4 line-clamp-2">{project.description}</p>
              
              <div className="mb-4">
                <div className="flex justify-between text-sm text-gray-500 mb-1">
                  <span>Progression</span>
                  <span>{project.progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="bg-blue-600 h-2.5 rounded-full" 
                    style={{ width: `${project.progress}%` }}
                  ></div>
                </div>
              </div>
              
              <div className="flex justify-between items-center text-sm">
                <div className="text-gray-500">
                  <span>Tâches: </span>
                  <span className="font-medium">{project.tasksCount.completed}/{project.tasksCount.total}</span>
                </div>
                
                <div className="flex -space-x-2">
                  {project.members.slice(0, 3).map((member: { id: string; email: string; role: string }) => (
                    <div 
                      key={member.id}
                      className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs"
                      title={`${member.email} (${member.role})`}
                    >
                      {member.email.charAt(0).toUpperCase()}
                    </div>
                  ))}
                  {project.members.length > 3 && (
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-xs">
                      +{project.members.length - 3}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-100 text-sm text-gray-500">
                <div className="flex justify-between">
                  <div>
                    <span>Début: </span>
                    <span>{new Date(project.startDate).toLocaleDateString('fr-FR')}</span>
                  </div>
                  <div>
                    <span>Fin: </span>
                    <span>{project.endDate ? new Date(project.endDate).toLocaleDateString('fr-FR') : 'Non définie'}</span>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
      
      {filteredProjects.length === 0 && (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-900">Aucun projet trouvé</h3>
          <p className="mt-1 text-gray-500">Aucun projet ne correspond aux critères sélectionnés.</p>
          <div className="mt-6">
            <Link 
              to="/dashboard/projects/new"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 inline-flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Créer un nouveau projet
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
