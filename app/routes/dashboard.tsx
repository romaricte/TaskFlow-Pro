import { json, LoaderFunction } from "@remix-run/node";
import { Link, NavLink, Outlet, useLoaderData } from "@remix-run/react";
import { requireUserId } from "~/session.server";
import { useUser } from "~/utils";
import { useState } from "react";
import { PrismaClient } from "@prisma/client";

type Project = {
  id: string;
  name: string;
  status: string;
  tasks: any[];
  boards: any[];
  members: any[];
};

export const loader: LoaderFunction = async ({ request }) => {
  const userId = await requireUserId(request);
  
  // Simuler des projets pour le moment (à remplacer par une vraie requête Prisma)
  const userProjects: Project[] = [{
    id: "1",
    name: "Projet Marketing Q2",
    status: "En cours",
    tasks: [],
    boards: [],
    members: []
  },
  {
    id: "2",
    name: "Refonte Site Web",
    status: "Planifié",
    tasks: [],
    boards: [],
    members: []
  },
  {
    id: "3",
    name: "Application Mobile",
    status: "En cours",
    tasks: [],
    boards: [],
    members: []
  }];

  return json({ userProjects });
};

export default function Dashboard() {
  const { userProjects } = useLoaderData<typeof loader>();
  const user = useUser();
  const [activeTab, setActiveTab] = useState("projects");

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-gradient-to-b from-blue-700 to-indigo-900 text-white p-4">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">TaskFlow Pro</h1>
          <p className="text-blue-200 text-sm">Gestion de projets avancée</p>
        </div>
        
        <nav className="space-y-1">
          <NavLink 
            to="/dashboard" 
            end
            className={({ isActive }) => 
              `block py-2 px-4 rounded ${isActive ? 'bg-blue-800' : 'hover:bg-blue-800'}`
            }
          >
            Tableau de bord
          </NavLink>
          <NavLink 
            to="/dashboard/projects" 
            className={({ isActive }) => 
              `block py-2 px-4 rounded ${isActive ? 'bg-blue-800' : 'hover:bg-blue-800'}`
            }
          >
            Projets
          </NavLink>
          <NavLink 
            to="/dashboard/kanban" 
            className={({ isActive }) => 
              `block py-2 px-4 rounded ${isActive ? 'bg-blue-800' : 'hover:bg-blue-800'}`
            }
          >
            Tableaux Kanban
          </NavLink>
          <NavLink 
            to="/dashboard/gantt" 
            className={({ isActive }) => 
              `block py-2 px-4 rounded ${isActive ? 'bg-blue-800' : 'hover:bg-blue-800'}`
            }
          >
            Diagrammes de Gantt
          </NavLink>
          <NavLink 
            to="/dashboard/tasks" 
            className={({ isActive }) => 
              `block py-2 px-4 rounded ${isActive ? 'bg-blue-800' : 'hover:bg-blue-800'}`
            }
          >
            Tâches
          </NavLink>
        </nav>
        
        <div className="absolute bottom-0 left-0 w-64 p-4">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 rounded-full bg-blue-800 flex items-center justify-center">
              {user.email.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-medium">{user.email}</p>
              <Link to="/logout" className="text-sm text-blue-300 hover:text-white">
                Déconnexion
              </Link>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <header className="bg-white shadow-sm">
          <div className="px-6 py-4">
            <h2 className="text-xl font-semibold text-gray-800">Tableau de bord</h2>
          </div>
        </header>
        
        <main className="p-6">
          <Outlet />
          
          {/* Default dashboard content when no route is selected */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium mb-4">Projets récents</h3>
              {userProjects.length > 0 ? (
                <ul className="space-y-2">
                  {userProjects.slice(0, 5).map((project: Project) => (
                    <li key={project.id} className="border-b pb-2">
                      <Link 
                        to={`/dashboard/projects/${project.id}`}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        {project.name}
                      </Link>
                      <p className="text-sm text-gray-500">{project.status}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500">Aucun projet trouvé</p>
              )}
              <div className="mt-4">
                <Link 
                  to="/dashboard/projects/new"
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  + Créer un nouveau projet
                </Link>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium mb-4">Tâches à faire</h3>
              <p className="text-gray-500">Aucune tâche en attente</p>
              <div className="mt-4">
                <Link 
                  to="/dashboard/tasks"
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Voir toutes les tâches
                </Link>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium mb-4">Activité récente</h3>
              <p className="text-gray-500">Aucune activité récente</p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}