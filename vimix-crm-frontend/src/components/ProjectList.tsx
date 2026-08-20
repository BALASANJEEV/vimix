// src/pages/ProjectList.tsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Filter,
  Eye,
  Edit,
  Plus,
  Calendar,
  Grid,
  List,
  DollarSign,
  Building,
  Trash2,
} from "lucide-react";
import {
  getProjects,
  deleteProject,
  updateProjectStage,
} from "../services/apiClient";
import type { Project, Client, ProjectStage } from "../types/types";
import { STAGES, SERVICES } from "../types/types";
import FormatCash from "./FormatCash";

interface ApiProject extends Project {
  client?: Client; // NOTE: backend returns `client` (not `Client`) in many APIs
  payments?: any[];
}

interface ProjectListProps {
  onUpdateProject: (project: Project) => void;
}

const ProjectList: React.FC<ProjectListProps> = ({ onUpdateProject }) => {
  const navigate = useNavigate();

  const [projects, setProjects] = useState<ApiProject[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [serviceFilter, setServiceFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"table" | "kanban">("table");

  // drag-and-drop states
  const [draggedProject, setDraggedProject] = useState<ApiProject | null>(null);
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true);
        const res = await getProjects();
        // backend might return res.data or res.data.projects - adjust if needed
        const payload = res.data;
        setProjects(Array.isArray(payload) ? payload : payload.projects || []);
      } catch (err: any) {
        console.error("Error fetching projects:", err);
        setError(
          err.response?.data?.message ||
            err.message ||
            "Failed to load projects"
        );
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  // Helper: optimistic update of a single project in local state
  const applyLocalProjectUpdate = (updated: ApiProject) => {
    setProjects((prev) =>
      prev.map((p) => (p.id === updated.id ? { ...p, ...updated } : p))
    );
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      await deleteProject(deleteId);
      setProjects((prev) => prev.filter((p) => p.id !== deleteId));
      setDeleteId(null);
    } catch (err) {
      console.error("Delete failed", err);
      alert("Failed to delete project");
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredProjects = projects.filter((project) => {
    const term = searchTerm.trim().toLowerCase();
    const matchesSearch =
      !term ||
      project.title.toLowerCase().includes(term) ||
      project.client?.name?.toLowerCase().includes(term) ||
      project.client?.company?.toLowerCase().includes(term) ||
      project.description?.toLowerCase().includes(term);
    const matchesStage = stageFilter === "all" || project.stage === stageFilter;
    const matchesService =
      serviceFilter === "all" || project.service === serviceFilter;
    return matchesSearch && matchesStage && matchesService;
  });

  // Stage badge colors for table view
  const getStageColor = (stage: string) => {
    const colors: Record<string, string> = {
      enquiry: "bg-gray-100 text-gray-800",
      "sow-provided": "bg-blue-100 text-blue-800",
      "proposal-sent": "bg-yellow-100 text-yellow-800",
      negotiation: "bg-orange-100 text-orange-800",
      prototyping: "bg-purple-100 text-purple-800",
      "signed-agreement": "bg-green-100 text-green-800",
      closed: "bg-green-200 text-green-900",
      "deal-lost": "bg-red-200 text-red-900",
    };
    return colors[stage] || "bg-gray-100 text-gray-800";
  };

  // Kanban column colors / border
  const getStageColorKanban = (stage: string) => {
    const colors: Record<string, string> = {
      enquiry: "border-gray-300 bg-gray-50",
      "sow-provided": "border-blue-300 bg-blue-50",
      "proposal-sent": "border-yellow-300 bg-yellow-50",
      negotiation: "border-orange-300 bg-orange-50",
      prototyping: "border-purple-300 bg-purple-50",
      "signed-agreement": "border-green-300 bg-green-50",
      closed: "border-green-400 bg-green-100",
      "deal-lost": "border-red-400 bg-red-100",
    };
    return colors[stage] || "border-gray-300 bg-gray-50";
  };

  // Drag handlers (using component state, not dataTransfer)
  const handleDragStart = (e: React.DragEvent, project: ApiProject) => {
    setDraggedProject(project);
    e.dataTransfer.effectAllowed = "move";
    // for good measure (some browsers require setData)
    try {
      e.dataTransfer.setData("text/plain", project.id);
    } catch {}
  };

  const handleDragEnd = () => {
    setDraggedProject(null);
    setDragOverStage(null);
  };

  const handleDragOver = (e: React.DragEvent, stageKey: string) => {
    e.preventDefault();
    setDragOverStage(stageKey);
  };

  const handleDrop = async (e: React.DragEvent, targetStage: string) => {
    e.preventDefault();

    if (!draggedProject || draggedProject.stage === targetStage) {
      setDragOverStage(null);
      return;
    }

    const updatedProject: ApiProject = {
      ...draggedProject,
      stage: targetStage as ProjectStage,
      stageHistory: [
        ...(draggedProject.stageHistory || []),
        {
          stage: targetStage as ProjectStage,
          date: new Date().toISOString().split("T")[0],
          notes: `Moved from ${STAGES[draggedProject.stage].label} to ${
            STAGES[targetStage as ProjectStage].label
          }`,
        },
      ],
    };

    // 1. Optimistically update local state (UI updates instantly)
    setProjects((prev) =>
      prev.map((p) => (p.id === updatedProject.id ? updatedProject : p))
    );

    try {
      // 2. Persist change in DB
      await updateProjectStage(draggedProject.id, targetStage);
      console.log("Stage updated successfully in DB");
    } catch (err) {
      console.error("Failed to update stage:", err);
      alert("Could not save stage change, reverting...");

      // 3. Revert UI if API fails
      setProjects((prev) =>
        prev.map((p) => (p.id === draggedProject.id ? draggedProject : p))
      );
    }

    setDragOverStage(null);
    setDraggedProject(null);
  };

  const renderKanbanBoard = () => {
    const stageKeys = Object.keys(STAGES);
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex space-x-4 overflow-x-auto pb-4">
          {stageKeys.map((stageKey) => {
            const stageValue = (STAGES as any)[stageKey];
            const stageProjects = filteredProjects.filter(
              (p) => p.stage === stageKey
            );
            const isDropTarget = dragOverStage === stageKey;
            return (
              <div key={stageKey} className="flex-1 min-w-[20rem]">
                <div
                  onDragOver={(e) => handleDragOver(e, stageKey)}
                  onDrop={(e) => handleDrop(e, stageKey)}
                  className={`rounded-lg border-2 h-full transition-all duration-200 ${getStageColorKanban(
                    stageKey
                  )} ${
                    isDropTarget ? "border-black bg-gray-100 shadow-lg" : ""
                  }`}
                >
                  <div className="p-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-black">
                        {stageValue.label}
                      </h3>
                      <span className="bg-black text-white text-xs px-2 py-1 rounded-full">
                        {stageProjects.length}
                      </span>
                    </div>
                    {isDropTarget && (
                      <div className="mt-2 text-xs text-gray-600 font-medium">
                        Drop here to move to {stageValue.label}
                      </div>
                    )}
                  </div>

                  <div className="p-4 space-y-3 min-h-[12rem]">
                    {stageProjects.map((project) => (
                      <article
                        key={project.id}
                        className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 cursor-move"
                        draggable
                        onDragStart={(e) => handleDragStart(e, project)}
                        onDragEnd={handleDragEnd}
                        onClick={() => navigate(`/projects/${project.id}`)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === "Enter")
                            navigate(`/projects/${project.id}`);
                        }}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1 pr-2">
                            <h4 className="font-medium text-black mb-1 truncate">
                              {project.title}
                            </h4>
                            <p className="text-sm text-gray-600 truncate">
                              {project.client?.name || "—"}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                              {project.client?.company || ""}
                            </p>
                          </div>

                          <div className="flex items-start space-x-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/projects/${project.id}`);
                              }}
                              className="text-gray-400 hover:text-black p-1 hover:bg-gray-100 rounded"
                              title="View Details"
                            >
                              <Eye size={14} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/projects/edit/${project.id}`);
                              }}
                              className="text-gray-400 hover:text-black p-1 hover:bg-gray-100 rounded"
                              title="Edit Project"
                            >
                              <Edit size={14} />
                            </button>
                          </div>
                        </div>

                        <div className="space-y-2 text-xs">
                          <div className="flex items-center justify-between">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                SERVICES[project.service].color
                              }`}
                            >
                              {SERVICES[project.service].label}
                            </span>
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                            <div className="flex items-center text-green-600">
                              <DollarSign size={12} className="mr-1" />
                              <span className="font-medium">
                                ${(project.totalPayments || 0).toLocaleString()}
                              </span>
                            </div>
                            <span className="text-gray-500 text-xs">
                              {new Date(project.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </article>
                    ))}

                    {stageProjects.length === 0 && (
                      <div className="text-center py-8 text-gray-400">
                        <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-gray-100 flex items-center justify-center">
                          <Grid size={20} />
                        </div>
                        <p className="text-sm">
                          {isDropTarget
                            ? "Drop project here"
                            : "No projects in this stage"}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="p-6 flex justify-center items-center min-h-[16rem]">
        <div className="text-lg text-gray-600">Loading projects...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-medium">Error loading projects</h3>
          <p className="text-red-600 mt-1">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-3 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const displayProjects =
    searchTerm || stageFilter !== "all" || serviceFilter !== "all"
      ? filteredProjects
      : projects;
      

  return (
    <div className="my-20 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-black mb-2">Projects</h2>
          <p className="text-gray-600">
            {displayProjects.length} project
            {displayProjects.length !== 1 ? "s" : ""} found
          </p>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center bg-gray-100 rounded-md p-1">
            <button
              onClick={() => setViewMode("table")}
              className={`flex items-center space-x-2 px-3 py-2 rounded-md transition-colors ${
                viewMode === "table"
                  ? "bg-white text-black shadow-sm"
                  : "text-gray-600 hover:text-black"
              }`}
            >
              <List size={16} />
              <span className="text-sm font-medium">Table</span>
            </button>

            <button
              onClick={() => setViewMode("kanban")}
              className={`flex items-center space-x-2 px-3 py-2 rounded-md transition-colors ${
                viewMode === "kanban"
                  ? "bg-white text-black shadow-sm"
                  : "text-gray-600 hover:text-black"
              }`}
            >
              <Grid size={16} />
              <span className="text-sm font-medium">Kanban</span>
            </button>
          </div>

          <button
            onClick={() => navigate("/projects/add")}
            className="flex items-center space-x-2 px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-colors"
          >
            <Plus size={18} />
            <span>Add Project</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={20}
            />
            <input
              type="text"
              placeholder="Search projects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:border-black outline-none"
            />
          </div>

          <div className="relative">
            <Filter
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={20}
            />
            <select
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:border-black outline-none bg-white"
            >
              <option value="all">All Stages</option>
              {Object.entries(STAGES).map(([key, value]) => (
                <option key={key} value={key}>
                  {value.label}
                </option>
              ))}
            </select>
          </div>

          <div className="relative">
            <Building
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={20}
            />
            <select
              value={serviceFilter}
              onChange={(e) => setServiceFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:border-black outline-none bg-white"
            >
              <option value="all">All Services</option>
              {Object.entries(SERVICES).map(([key, value]) => (
                <option key={key} value={key}>
                  {value.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Table or Kanban */}
      {viewMode === "table" ? (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Project
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Client
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Service
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stage
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Revenue
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="bg-white divide-y divide-gray-200">
                {displayProjects.map((project) => (
                  <tr
                    key={project.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-black">
                          {project.title}
                        </div>
                        {project.description && (
                          <div className="text-sm text-gray-600 truncate max-w-xs">
                            {project.description}
                          </div>
                        )}
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-black">
                          {project.client?.name || "—"}
                        </div>
                        <div className="text-sm text-gray-600">
                          {project.client?.company || ""}
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          SERVICES[project.service].color
                        }`}
                      >
                        {SERVICES[project.service].label}
                      </span>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStageColor(
                          project.stage
                        )}`}
                      >
                        {STAGES[project.stage].label}
                      </span>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-black">
                      ₹<FormatCash amount={project.totalPayments}/>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {new Date(project.createdAt).toLocaleDateString()}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => navigate(`/projects/${project.id}`)}
                          className="text-black hover:text-gray-600 p-1 hover:bg-gray-100 rounded"
                          title="View Details"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() =>
                            navigate(`/projects/edit/${project.id}`)
                          }
                          className="text-black hover:text-gray-600 p-1 hover:bg-gray-100 rounded"
                          title="Edit Project"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => setDeleteId(project.id)}
                          className="text-red-600 hover:text-red-800 p-1 hover:bg-red-50 rounded"
                          title="Delete Project"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {displayProjects.length === 0 && (
            <div className="text-center py-12">
              <Building size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">
                {projects.length === 0
                  ? "No projects found. Create your first project to get started."
                  : "No projects match your current filters."}
              </p>
              {projects.length === 0 && (
                <button
                  onClick={() => navigate("/projects/add")}
                  className="mt-4 flex items-center space-x-2 px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-colors mx-auto"
                >
                  <Plus size={16} />
                  <span>Create First Project</span>
                </button>
              )}
            </div>
          )}
        </div>
      ) : (
        renderKanbanBoard()
      )}

      {/* Delete modal (single instance) */}
      {deleteId && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/20 z-50 !m-0">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              Delete Project
            </h3>
            <p className="text-sm text-gray-600 mb-6 leading-relaxed">
              Are you sure you want to delete this project?{" "}
              <span className="font-medium text-red-600">
                This action cannot be undone.
              </span>
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setDeleteId(null)}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectList;
