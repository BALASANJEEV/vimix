import React, { useState, useEffect } from 'react';
import { Project, Client, ActivityLogEntry, Payment } from '../types/types';
import { STAGES, SERVICES } from '../types/types';
import {
  ArrowLeft, Mail, Phone, Building, Calendar, FileText,
  Edit, Upload, Download, Eye, Trash2, Plus, Clock, Activity, User,
  FileUp, FileX, CreditCard,
  IndianRupee
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { getProjectDetails, uploadProjectDocument, deleteProjectDocument, addProjectMeeting } from '../services/apiClient';

const ProjectDetail: React.FC = () => {

  const baseUrl = import.meta.env.VITE_API_URL;

  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [project, setProject] = useState<Project | null>(null);

  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<'overview' | 'payments' | 'documents' | 'meetings' | 'activity'>('overview');
  const [showAddMeeting, setShowAddMeeting] = useState(false);
  const [newMeeting, setNewMeeting] = useState({ date: '', time: '', title: '', notes: '' });

  useEffect(() => {
    if (!id) return;
    const fetchData = async () => {
      try {
        setLoading(true);
        const { data } = await getProjectDetails(id);
        setProject(data.project);
        setClient(data.client);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (loading) {
    return <div className="p-6 text-center">Loading project details...</div>;
  }

  if (!project) {
    return (
      <div className=" my-20 p-6 text-center">
        <p className="text-gray-500">Project not found</p>
        <button onClick={() => navigate('/projects')} className="mt-4 text-blue-600 hover:underline">
          Back to Projects
        </button>
      </div>
    );
  }

  const projectPayments: Payment[] = project.payments || [];
  const paidPayments = projectPayments.filter(p => p.status === 'paid');
  const pendingPayments = projectPayments.filter(p => p.status === 'pending');

  const handleAddMeeting = async () => {
    if (!project) return;
    try {
      const { data } = await addProjectMeeting(project.id, newMeeting);
      setProject(prev => prev ? { ...prev, meetings: data.meetings, activityLog: data.activityLog } : prev);
      setShowAddMeeting(false);
      setNewMeeting({ date: '', time: '', title: '', notes: '' });
    } catch (e) {
      console.error(e);
      alert('Failed to add meeting');
    }
  };

  const handleFileUpload = async (documentType: keyof NonNullable<Project['documents']>, file: File) => {
    if (!project) return;
    try {
      const { data } = await uploadProjectDocument(project.id, documentType, file);
      setProject(prev => prev ? { ...prev, documents: data.documents, activityLog: data.activityLog } : prev);
    } catch (e) {
      console.error(e);
      alert('Upload failed');
    }
  };

  const handleFileDelete = async (documentType: keyof NonNullable<Project['documents']>) => {
    if (!project) return;
    try {
      const { data } = await deleteProjectDocument(project.id, documentType);
      setProject(prev => prev ? { ...prev, documents: data.documents, activityLog: data.activityLog } : prev);
    } catch (e) {
      console.error(e);
      alert('Delete failed');
    }
  };

  const getStageProgress = (stage: string) => {
    const total = Object.keys(STAGES).length;
    return (STAGES[stage as keyof typeof STAGES].order / total) * 100;
  };

  const getStageColor = (stage: string) => {
    const colors: Record<string, string> = {
      'enquiry': 'bg-gray-500',
      'sow-provided': 'bg-blue-500',
      'proposal-sent': 'bg-yellow-500',
      'negotiation': 'bg-orange-500',
      'prototyping': 'bg-purple-500',
      'signed-agreement': 'bg-green-500'
    };
    return colors[stage] || 'bg-gray-500';
  };

  const getPaymentStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'paid': 'bg-green-100 text-green-800',
      'pending': 'bg-yellow-100 text-yellow-800',
      'overdue': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getActivityIcon = (type: ActivityLogEntry['type']) => {
    switch (type) {
      case 'project_created': return <User size={16} className="text-blue-600" />;
      case 'stage_change': return <Activity size={16} className="text-purple-600" />;
      case 'document_upload': return <FileUp size={16} className="text-green-600" />;
      case 'document_update': return <FileText size={16} className="text-orange-600" />;
      case 'document_delete': return <FileX size={16} className="text-red-600" />;
      case 'meeting_added': return <Calendar size={16} className="text-indigo-600" />;
      case 'payment_added': return <CreditCard size={16} className="text-green-600" />;
      case 'project_updated': return <Edit size={16} className="text-gray-600" />;
      default: return <Activity size={16} className="text-gray-600" />;
    }
  };

  const formatActivityTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mt-20">
        <div className="flex items-center space-x-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-md">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-3xl font-bold text-black">{project.title}</h2>
            <p className="text-gray-600">{client?.name} - {client?.company}</p>
          </div>
        </div>
        <button
          onClick={() => navigate(`/projects/edit/${project.id}`)}
          className="flex items-center space-x-2 px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800"
        >
          <Edit size={16} />
          <span>Edit Project</span>
        </button>
      </div>

      {/* Stage Progress */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-black">Current Stage</h3>
          <span className={`px-3 py-1 rounded-full text-sm font-medium text-white ${getStageColor(project.stage)}`}>
            {STAGES[project.stage].label}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className={`h-3 rounded-full transition-all ${getStageColor(project.stage)}`}
            style={{ width: `${getStageProgress(project.stage)}%` }}
          ></div>
        </div>
        <div className="flex justify-between text-sm text-gray-600 mt-2">
          <span>Stage {STAGES[project.stage].order} of {Object.keys(STAGES).length}</span>
          <span>{Math.round(getStageProgress(project.stage))}% Complete</span>
        </div>
      </div>
      
{/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'overview'
                ? 'border-black text-black'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('payments')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'payments'
                ? 'border-black text-black'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Payments ({projectPayments.length})
          </button>
          <button
            onClick={() => setActiveTab('documents')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'documents'
                ? 'border-black text-black'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Documents
          </button>
          <button
            onClick={() => setActiveTab('meetings')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'meetings'
                ? 'border-black text-black'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Meetings ({(project.meetings || []).length})
          </button>
          <button
            onClick={() => setActiveTab('activity')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'activity'
                ? 'border-black text-black'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Activity Log ({(project.activityLog || []).length})
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Project Information */}
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-black mb-4">Project Information</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Service Type</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${SERVICES[project.service].color}`}>
                  {SERVICES[project.service].label}
                </span>
              </div>
              {project.budget && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Budget</span>
                  <span className="font-medium text-black">₹{project.budget.toLocaleString()}</span>
                </div>
              )}
              {project.deadline && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Deadline</span>
                  <span className="font-medium text-black">{new Date(project.deadline).toLocaleDateString()}</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Created</span>
                <span className="font-medium text-black">{new Date(project.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          {/* Payment Summary */}
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-black">Payment Summary</h3>
              <button
                onClick={() => navigate('/payments/add')}
                className="px-3 py-1 bg-black text-white text-sm rounded-md hover:bg-gray-800 transition-colors"
              >
                Add Payment
              </button>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Total Payments</span>
                <span className="text-xl font-bold text-green-600">₹{project.totalPayments.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Paid Invoices</span>
                <span className="font-medium text-black">{paidPayments.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Pending Invoices</span>
                <span className="font-medium text-orange-600">{pendingPayments.length}</span>
              </div>
            </div>
          </div>

          {/* Client Information */}
          {client && (
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold text-black mb-4">Client Information</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <User size={18} className="text-gray-400" />
                  <span className="text-black">{client.name}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Mail size={18} className="text-gray-400" />
                  <span className="text-black">{client.email}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Phone size={18} className="text-gray-400" />
                  <span className="text-black">{client.phone}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Building size={18} className="text-gray-400" />
                  <span className="text-black">{client.company}</span>
                </div>
              </div>
            </div>
          )}

          {/* Description */}
          {project.description && (
            <div className="bg-white p-6 rounded-lg border border-gray-200 lg:col-span-2">
              <h3 className="text-lg font-semibold text-black mb-3 flex items-center">
                <FileText size={18} className="mr-2" />
                Project Description
              </h3>
              <p className="text-gray-700 leading-relaxed">{project.description}</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'payments' && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg font-semibold text-black">Payment History</h3>
            <button
              onClick={() => navigate('/payments/add')}
              className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-colors"
            >
              Add Payment
            </button>
          </div>
          
          {projectPayments.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {projectPayments.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((payment) => (
                    <tr key={payment.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                        {new Date(payment.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-black">{payment.description}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-black">
                        ${payment.amount.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getPaymentStatusColor(payment.status)}`}>
                          {payment.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <IndianRupee size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">No payments recorded yet.</p>
              <button
                onClick={() => navigate('/payments/add')}
                className="mt-2 text-black hover:underline"
              >
                Add the first payment
              </button>
            </div>
          )}
        </div>
      )}

      {/* Documents Tab */}
      {activeTab === 'documents' && (
        <div className="space-y-6">
          {[
            { key: 'srs' as const, label: 'Software Requirements Specification (SRS)' },
            { key: 'proposal' as const, label: 'Proposal' },
            { key: 'signedAgreement' as const, label: 'Signed Agreement' },
            { key: 'nda' as const, label: 'Non-Disclosure Agreement (NDA)' },
            { key: 'sow' as const, label: 'Statement of Work (SoW)' },
          ].map((docType) => {
            const document = project.documents?.[docType.key];
            
            return (
              <div key={docType.key} className="bg-white p-6 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-black">{docType.label}</h3>
                  {document && (
  <div className="flex items-center space-x-2">
    {/* 👁 View Document */}
    <a
      href={`${baseUrl}${document.url}`}
      target="_blank"
      rel="noopener noreferrer"
      className="p-2 text-gray-600 hover:text-black hover:bg-gray-100 rounded-md transition-colors"
      title="View Document"
    >
      <Eye size={16} />
    </a>

    {/* ⬇️ Download Document */}
    <a
      href={`${baseUrl}${document.url}`}
      target="_blank"
      download
      className="p-2 text-gray-600 hover:text-black hover:bg-gray-100 rounded-md transition-colors"
      title="Download Document"
    >
      <Download size={16} />
    </a>

    {/* 🗑 Delete Document */}
    <button
      onClick={() => handleFileDelete(docType.key)}
      className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors"
      title="Delete Document"
    >
      <Trash2 size={16} />
    </button>
  </div>
)}


                </div>
                
                {document ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                      <div className="flex items-center space-x-3">
                        <FileText size={20} className="text-gray-400" />
                        <div>
                          <p className="font-medium text-black">{document.name}</p>
                          <p className="text-sm text-gray-600">
                            Uploaded {new Date(document.uploadDate).toLocaleDateString()} • {(document.size / 1024).toFixed(1)} KB
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="border-t border-gray-200 pt-3">
                      <label className="block">
                        <input
                          type="file"
                          className="hidden"
                          accept=".pdf,.doc,.docx"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              handleFileUpload(docType.key, file);
                            }
                          }}
                        />
                        <span className="inline-flex items-center space-x-2 px-3 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors cursor-pointer">
                          <Upload size={16} />
                          <span>Update Document</span>
                        </span>
                      </label>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                    <FileText size={48} className="mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-500 mb-4">No {docType.label.toLowerCase()} uploaded yet</p>
                    <label className="inline-block">
                      <input
                        type="file"
                        className="hidden"
                        accept=".pdf,.doc,.docx"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleFileUpload(docType.key, file);
                          }
                        }}
                      />
                      <span className="inline-flex items-center space-x-2 px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-colors cursor-pointer">
                        <Upload size={16} />
                        <span>Upload {docType.label}</span>
                      </span>
                    </label>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Meetings Tab */}
      {activeTab === 'meetings' && (
        <div className="space-y-6">
          <div className="flex justify-end">
            <button
              onClick={() => setShowAddMeeting(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-colors"
            >
              <Plus size={16} />
              <span>Add Meeting</span>
            </button>
          </div>

          {showAddMeeting && (
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold text-black mb-4">Add New Meeting</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                  <input
                    type="date"
                    value={newMeeting.date}
                    onChange={(e) => setNewMeeting(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:border-black outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Time</label>
                  <input
                    type="time"
                    value={newMeeting.time}
                    onChange={(e) => setNewMeeting(prev => ({ ...prev, time: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:border-black outline-none"
                  />
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Meeting Title</label>
                <input
                  type="text"
                  value={newMeeting.title}
                  onChange={(e) => setNewMeeting(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g., Project kickoff meeting"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:border-black outline-none"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                <textarea
                  value={newMeeting.notes}
                  onChange={(e) => setNewMeeting(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Meeting agenda, discussion points, etc."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:border-black outline-none resize-vertical"
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowAddMeeting(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddMeeting}
                  disabled={!newMeeting.date || !newMeeting.time || !newMeeting.title}
                  className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  Add Meeting
                </button>
              </div>
            </div>
          )}

          <div className="bg-white rounded-lg border border-gray-200">
            {(project.meetings || []).length > 0 ? (
              <div className="divide-y divide-gray-200">
                {(project.meetings || [])
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map((meeting) => (
                    <div key={meeting.id} className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <Calendar size={18} className="text-gray-400" />
                            <h4 className="text-lg font-medium text-black">{meeting.title}</h4>
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                            <span className="flex items-center space-x-1">
                              <Calendar size={14} />
                              <span>{new Date(meeting.date).toLocaleDateString()}</span>
                            </span>
                            <span className="flex items-center space-x-1">
                              <Clock size={14} />
                              <span>{meeting.time}</span>
                            </span>
                          </div>
                          {meeting.notes && (
                            <p className="text-gray-700 leading-relaxed">{meeting.notes}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Calendar size={48} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500">No meetings recorded yet.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Activity Tab */}
      {activeTab === 'activity' && (
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-black flex items-center">
              <Activity size={18} className="mr-2" />
              Activity Log
            </h3>
          </div>
          
          {(project.activityLog || []).length > 0 ? (
            <div className="divide-y divide-gray-200">
              {(project.activityLog || [])
                .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                .map((activity) => (
                  <div key={activity.id} className="p-6">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-1">
                        {getActivityIcon(activity.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-medium text-black">
                            {activity.description}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatActivityTime(activity.timestamp)}
                          </p>
                        </div>
                        <p className="text-xs text-gray-600">
                          {new Date(activity.timestamp).toLocaleString()}
                        </p>
                        {activity.details && (
                          <div className="mt-2 text-xs text-gray-500">
                            {activity.details.fromStage && activity.details.toStage && (
                              <span>
                                From: {STAGES[activity.details.fromStage].label} → To: {STAGES[activity.details.toStage].label}
                              </span>
                            )}
                            {activity.details.documentName && (
                              <span>File: {activity.details.documentName}</span>
                            )}
                            {activity.details.meetingTitle && (
                              <span>Meeting: {activity.details.meetingTitle}</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Activity size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">No activity recorded yet.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProjectDetail;


