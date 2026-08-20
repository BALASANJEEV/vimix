import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Filter,
  Eye,
  Edit,
  Plus,
  UserCheck,
  Building,
  Trash2,
  Mail,
  Phone,
} from 'lucide-react';
import {
  getPartners,
  deletePartner,
} from '../services/apiClient';

interface Partner {
  id: string;
  name: string;
  email: string;
  company?: string;
  username: string;
  isActive: boolean;
  createdAt: string;
}

const PartnerList: React.FC = () => {
  const navigate = useNavigate();

  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true);
        const res = await getPartners();
        setPartners(res.data);
      } catch (err: any) {
        console.error('Error fetching partners:', err);
        setError(
          err.response?.data?.message ||
            err.message ||
            'Failed to load partners'
        );
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      await deletePartner(deleteId);
      setPartners((prev) => prev.filter((p) => p.id !== deleteId));
      setDeleteId(null);
    } catch (err) {
      console.error('Delete failed', err);
      alert('Failed to delete partner');
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredPartners = partners.filter((partner) => {
    const term = searchTerm.trim().toLowerCase();
    const matchesSearch =
      !term ||
      partner.name.toLowerCase().includes(term) ||
      partner.email.toLowerCase().includes(term) ||
      partner.company?.toLowerCase().includes(term) ||
      partner.username.toLowerCase().includes(term);
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && partner.isActive) ||
      (statusFilter === 'inactive' && !partner.isActive);
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (isActive: boolean) => {
    return isActive 
      ? 'bg-green-100 text-green-800' 
      : 'bg-red-100 text-red-800';
  };

  if (loading) {
    return (
      <div className="p-6 flex justify-center items-center min-h-[16rem]">
        <div className="text-lg text-gray-600">Loading partners...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-medium">Error loading partners</h3>
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

  return (
    <div className="my-20 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-black mb-2">Partners</h2>
          <p className="text-gray-600">
            {filteredPartners.length} partner
            {filteredPartners.length !== 1 ? 's' : ''} found
          </p>
        </div>

        <button
          onClick={() => navigate('/partners/add')}
          className="flex items-center space-x-2 px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-colors"
        >
          <Plus size={18} />
          <span>Add Partner</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={20}
            />
            <input
              type="text"
              placeholder="Search partners..."
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
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:border-black outline-none bg-white"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Partner
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Company
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
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
              {filteredPartners.map((partner) => (
                <tr
                  key={partner.id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                          <UserCheck size={20} className="text-gray-600" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-black">
                          {partner.name}
                        </div>
                        <div className="text-sm text-gray-600">
                          @{partner.username}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-black">{partner.email}</div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-black">
                      {partner.company || '—'}
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                        partner.isActive
                      )}`}
                    >
                      {partner.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {new Date(partner.createdAt).toLocaleDateString()}
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => navigate(`/partners/${partner.id}`)}
                        className="text-black hover:text-gray-600 p-1 hover:bg-gray-100 rounded"
                        title="View Details"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={() =>
                          navigate(`/partners/edit/${partner.id}`)
                        }
                        className="text-black hover:text-gray-600 p-1 hover:bg-gray-100 rounded"
                        title="Edit Partner"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => setDeleteId(partner.id)}
                        className="text-red-600 hover:text-red-800 p-1 hover:bg-red-50 rounded"
                        title="Delete Partner"
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

        {filteredPartners.length === 0 && (
          <div className="text-center py-12">
            <UserCheck size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">
              {partners.length === 0
                ? 'No partners found. Create your first partner to get started.'
                : 'No partners match your current filters.'}
            </p>
            {partners.length === 0 && (
              <button
                onClick={() => navigate('/partners/add')}
                className="mt-4 flex items-center space-x-2 px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-colors mx-auto"
              >
                <Plus size={16} />
                <span>Create First Partner</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Delete modal */}
      {deleteId && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/20 z-50 !m-0">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              Delete Partner
            </h3>
            <p className="text-sm text-gray-600 mb-6 leading-relaxed">
              Are you sure you want to delete this partner?{' '}
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
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PartnerList;
