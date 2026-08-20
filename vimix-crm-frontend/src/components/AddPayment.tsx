import React, { useState, useEffect } from "react";
import { Save, X } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import {
  getPaymentById,
  createPayment,
  updatePayment,
  getClients,
  getProjects,
} from "../services/apiClient";
import { Client, Payment, Project } from "../types/types";

const PaymentForm: React.FC = () => {
  const { id } = useParams<{ id: string }>(); // if id exists → edit mode
  const navigate = useNavigate();

  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    clientId: "",
    projectId: "",
    amount: "",
    date: new Date().toISOString().split("T")[0],
    description: "",
    status: "pending" as "paid" | "pending" | "overdue",
  });

  // Load clients, projects, and existing payment if editing
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [clientsRes, projectsRes] = await Promise.all([
          getClients(),
          getProjects(),
        ]);
        setClients(clientsRes.data);
        setProjects(projectsRes.data);

        if (id) {
          const paymentRes = await getPaymentById(id);
          const p: Payment = paymentRes.data;
          setFormData({
            clientId: p.clientId || "",
            projectId: p.projectId || "",
            amount: String(p.amount),
            date: p.date.split("T")[0],
            description: p.description || "",
            status: p.status,
          });
        }
      } catch (err) {
        console.error("Failed to load form data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        amount: parseFloat(formData.amount),
      };

      if (id) {
        await updatePayment(id, payload);
      } else {
        await createPayment(payload);
      }

      navigate("/payments");
    } catch (err) {
      console.error("Failed to save payment:", err);
    }
  };

  const handleCancel = () => {
    navigate("/payments");
  };

  if (loading) return <p className="p-6">Loading...</p>;

  return (
    <div className="my-20 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-black">
            {id ? "Edit Payment" : "Add Payment"}
          </h2>
          <p className="text-gray-600">
            {id
              ? "Update payment details"
              : "Record a new payment from a client"}
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
            {/* Client */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Client
              </label>
              <select
                name="clientId"
                value={formData.clientId}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-black"
              >
                <option value="">Select a client</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} - {c.company}
                  </option>
                ))}
              </select>
            </div>

            {/* Project */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Project
              </label>
              <select
                name="projectId"
                value={formData.projectId}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-black"
              >
                <option value="">Select a project</option>
                {projects
                  .filter((p) => p.clientId === formData.clientId) // 🔹 only show this client's projects
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title}
                    </option>
                  ))}
              </select>
            </div>

            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount
              </label>
              <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleInputChange}
                required
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-black"
              />
            </div>

            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Date
              </label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-black"
              />
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-black"
              >
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              required
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-black resize-vertical"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-4 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center space-x-2 px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800"
            >
              <Save size={16} />
              <span>{id ? "Update Payment" : "Add Payment"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PaymentForm;
