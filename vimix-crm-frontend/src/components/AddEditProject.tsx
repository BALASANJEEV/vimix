import React, { useState, useEffect } from "react";
import {
  Project,
  Client,
  ProjectStage,
  ServiceType,
  ActivityLogEntry,
} from "../types/types";
import { STAGES, SERVICES } from "../types/types";
import { Save, X } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import {
  createProject,
  updateProject,
  getProjectById,
  getClients,
} from "../services/apiClient";

interface AddEditProjectProps {
  projects: Project[];
  clients: Client[]; // if empty, we fetch from backend
  onSave: (project: Project) => void;
  onCancel?: () => void;
}

const AddEditProject: React.FC<AddEditProjectProps> = ({
  projects,
  clients: initialClients,
  onSave,
  onCancel,
}) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  const [clients, setClients] = useState<Client[]>(initialClients || []);
  const [existingProject, setExistingProject] = useState<Project | undefined>(
    undefined
  );

  const [formData, setFormData] = useState({
    clientId: "",
    title: "",
    service: "app-development" as ServiceType,
    stage: "enquiry" as ProjectStage,
    description: "",
    budget: "",
    deadline: "",
    currency: "INR", // Default currency
  });

  // --- Fetch clients if not provided ---
  useEffect(() => {
    const fetchClients = async () => {
      try {
        const res = await getClients(); // API call to fetch all clients
        setClients(res.data);
      } catch (err) {
        console.error("Failed to fetch clients", err);
      }
    };

    if (clients.length === 0) {
      fetchClients();
    }
  }, [clients.length]);

  // --- Fetch project by ID ---
  useEffect(() => {
    const fetchProject = async () => {
      if (id) {
        try {
          const res = await getProjectById(id);
          setExistingProject(res.data);
          setFormData({
            clientId: res.data.clientId,
            title: res.data.title,
            service: res.data.service,
            stage: res.data.stage,
            description: res.data.description || "",
            budget: res.data.budget?.toString() || "",
            deadline: res.data.deadline?.split("T")[0] || "",
            currency: res.data.currency || "INR",
          });
        } catch (err) {
          console.error("Failed to fetch project", err);
          alert("Failed to load project data");
        }
      }
    };
    fetchProject();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const isNewProject = !existingProject;
    const currentTime = new Date().toISOString();

    // ----- activity log -----
    const activityEntries: ActivityLogEntry[] = [];
    if (isNewProject) {
      activityEntries.push({
        id: Date.now().toString() + "_created",
        type: "project_created",
        description: "Project enquiry created",
        timestamp: currentTime,
      });
    } else {
      activityEntries.push({
        id: Date.now().toString() + "_updated",
        type: "project_updated",
        description: "Project information updated",
        timestamp: currentTime,
      });
      if (existingProject.stage !== formData.stage) {
        activityEntries.push({
          id: Date.now().toString() + "_stage",
          type: "stage_change",
          description: `Moved from ${STAGES[existingProject.stage].label} to ${
            STAGES[formData.stage].label
          }`,
          timestamp: currentTime,
          details: {
            fromStage: existingProject.stage,
            toStage: formData.stage,
          },
        });
      }
    }

    const projectData: Project = {
      id: existingProject?.id || `project-${Date.now()}`,
      ...formData,
      value: formData.budget ? parseFloat(formData.budget) : 0,
      budget: formData.budget ? parseFloat(formData.budget) : undefined,
      deadline: formData.deadline ? new Date(formData.deadline) : null, 
      totalPayments: existingProject?.totalPayments || 0,
      createdAt:
        existingProject?.createdAt || new Date().toISOString().split("T")[0],
      stageHistory: isNewProject
        ? [
            {
              stage: formData.stage,
              date: new Date().toISOString().split("T")[0],
            },
          ]
        : existingProject?.stageHistory || [],
      activityLog: [
        ...(existingProject?.activityLog || []),
        ...activityEntries,
      ],
    };

    try {
      if (isNewProject) {
        await createProject(projectData);
      } else {
        await updateProject(existingProject!.id, projectData);
      }
      navigate("/projects");
    } catch (err: any) {
      console.error("Error saving project", err);
      alert(
        err.response?.data?.message ||
          "Something went wrong while saving project"
      );
    }
  };

  const handleCancel = () => {
    if (onCancel) onCancel();
    else navigate("/projects");
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className=" my-20 p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-black">
            {isEditMode ? "Edit Project" : "Add New Project"}
          </h2>
          <p className="text-gray-600">
            {isEditMode
              ? "Update project information"
              : "Create a new project enquiry"}
          </p>
        </div>
        <button
          onClick={handleCancel}
          className="p-2 hover:bg-gray-100 rounded-md transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Client - full width */}
          <div className="md:col-span-2">
            <label
              htmlFor="clientId"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Client
            </label>
            <select
              id="clientId"
              name="clientId"
              value={formData.clientId}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, clientId: e.target.value }))
              }
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:border-black outline-none bg-white"
            >
              <option value="">Select a client</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name} - {client.company}
                </option>
              ))}
            </select>
          </div>

          {/* Grid for main fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Project Title */}
            <div>
              <label
                htmlFor="title"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Project Title
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:border-black outline-none"
                placeholder="Enter project title"
              />
            </div>

            {/* Service */}
            <div>
              <label
                htmlFor="service"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Service Type
              </label>
              <select
                id="service"
                name="service"
                value={formData.service}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:border-black outline-none bg-white"
              >
                {Object.entries(SERVICES).map(([key, value]) => (
                  <option key={key} value={key}>
                    {value.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Stage */}
            <div>
              <label
                htmlFor="stage"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Current Stage
              </label>
              <select
                id="stage"
                name="stage"
                value={formData.stage}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:border-black outline-none bg-white"
              >
                {Object.entries(STAGES).map(([key, value]) => (
                  <option key={key} value={key}>
                    {value.order}. {value.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Budget */}
            <div>
              <label
                htmlFor="budget"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Budget
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                  ₹
                </span>
                <input
                  type="number"
                  id="budget"
                  name="budget"
                  value={formData.budget}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:border-black outline-none"
                  placeholder="0.00"
                />
              </div>
            </div>

            {/* Currency */}
            <div>
              <label
                htmlFor="currency"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Currency
              </label>
              <select
                id="currency"
                name="currency"
                value={formData.currency}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:border-black outline-none bg-white"
              >
                <option value="INR">INR - Indian Rupee</option>
                <option value="USD">USD - US Dollar</option>
                <option value="EUR">EUR - Euro</option>
                {/* Add more currencies as needed */}
              </select>
            </div>

            {/* Deadline */}
            <div>
              <label
                htmlFor="deadline"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Deadline
              </label>
              <input
                type="date"
                id="deadline"
                name="deadline"
                value={formData.deadline}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:border-black outline-none"
              />
            </div>
          </div>

          {/* Description - full width */}
          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Project Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:border-black outline-none resize-vertical"
              placeholder="Describe the project requirements and scope..."
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-4 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center space-x-2 px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-colors"
            >
              <Save size={16} />
              <span>{isEditMode ? "Update Project" : "Create Project"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddEditProject;