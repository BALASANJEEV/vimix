import React, { useState, useEffect } from "react";
import { Client, ClientStage, ActivityLogEntry } from "../types/types";
import { STAGES } from "../types/types";
import { Save, X } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { createClient, updateClient, getClientById } from '../services/apiClient';


interface AddEditClientProps {
  clients: Client[];
  onSave: (client: Client) => void;
  onCancel?: () => void;
}

const AddEditClient: React.FC<AddEditClientProps> = ({
  clients,
  onSave,
  onCancel,
}) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  const [existingClient, setExistingClient] = useState<Client | undefined>(undefined);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    stage: "enquiry" as ClientStage,
    notes: "",
  });

  useEffect(() => {
  const fetchClient = async () => {
    if (id && !existingClient) {
      try {
        const res = await getClientById(id);
        setExistingClient(res.data);
        setFormData({
          name: res.data.name,
          email: res.data.email,
          phone: res.data.phone,
          company: res.data.company,
          stage: res.data.stage,
          notes: res.data.notes || "",
        });
      } catch (err) {
        console.error("Failed to fetch client:", err);
        alert("Failed to load client data");
      }
    }
  };

  fetchClient();
}, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const isNewClient = !existingClient;
    const currentTime = new Date().toISOString();

    // ----- activity log creation (unchanged) -----
    const activityEntries: ActivityLogEntry[] = [];
    if (isNewClient) {
      activityEntries.push({
        id: Date.now().toString() + "_created",
        type: "client_created",
        description: "Enquiry created",
        timestamp: currentTime,
      });
    } else {
      activityEntries.push({
        id: Date.now().toString() + "_updated",
        type: "client_updated",
        description: "Client information updated",
        timestamp: currentTime,
      });

      if (existingClient.stage !== formData.stage) {
        activityEntries.push({
          id: Date.now().toString() + "_stage",
          type: "stage_change",
          description: `Moved from ${STAGES[existingClient.stage].label} to ${
            STAGES[formData.stage].label
          }`,
          timestamp: currentTime,
          details: {
            fromStage: existingClient.stage,
            toStage: formData.stage,
          },
        });
      }
    }

    const clientData: Client = {
      id: existingClient?.id || `client-${Date.now()}`,
      ...formData,
      totalPayments: existingClient?.totalPayments || 0,
      createdAt:
        existingClient?.createdAt || new Date().toISOString().split("T")[0],
      stageHistory: isNewClient
        ? [
            {
              stage: formData.stage,
              date: new Date().toISOString().split("T")[0],
            },
          ]
        : existingClient?.stageHistory || [],
      activityLog: [...(existingClient?.activityLog || []), ...activityEntries],
    };

    try {
      if (isNewClient) {
      await createClient(clientData);
    } else {
      await updateClient(existingClient!.id, clientData);
    }
      // navigate back after successful save
      navigate("/clients");
    } catch (err: any) {
      console.error("Error saving client", err);
      alert(
        err.response?.data?.message ||
          "Something went wrong while saving client"
      );
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      navigate("/clients");
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <div className=" my-20 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-black">
            {isEditMode ? "Edit Client" : "Add New Client"}
          </h2>
          <p className="text-gray-600">
            {isEditMode
              ? "Update client information"
              : "Add a new client to your pipeline"}
          </p>
        </div>
        <button
          onClick={handleCancel}
          className="p-2 hover:bg-gray-100 rounded-md transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      {/* Form */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Name */}
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Full Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:border-black outline-none"
                placeholder="Enter client's full name"
              />
            </div>

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:border-black outline-none"
                placeholder="client@company.com"
              />
            </div>

            {/* Phone */}
            <div>
              <label
                htmlFor="phone"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Phone Number
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:border-black outline-none"
                placeholder="+91 987654310"
              />
            </div>

            {/* Company */}
            <div>
              <label
                htmlFor="company"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Company
              </label>
              <input
                type="text"
                id="company"
                name="company"
                value={formData.company}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:border-black outline-none"
                placeholder="Company name"
              />
            </div>

            {/* Stage */}
            <div className="md:col-span-2">
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
          </div>

          {/* Notes */}
          <div>
            <label
              htmlFor="notes"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Notes
            </label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:border-black outline-none resize-vertical"
              placeholder="Add any relevant notes about this client..."
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
              <span>{isEditMode ? "Update Client" : "Add Client"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddEditClient;
