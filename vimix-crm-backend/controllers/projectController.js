import Project from '../models/Project.js';
import Client from '../models/Client.js';
import Payment from '../models/Payment.js';
import path from 'path';
import fs from 'fs';

/** Create project */
export const createProject = async (req, res) => {
  try {
    const { id: userId, role } = req.user;
    const {
      clientId,
      title,
      service,
      stage = 'enquiry',
      description,
      budget,
      deadline,
      stageHistory,
      activityLog,
      documents,
      meetings,
      priority = 'medium',
    } = req.body;

    const client = await Client.findById(clientId);
    if (!client) return res.status(404).json({ message: 'Client not found' });

    // Partner can only create projects for clients they created
    if (role === 'partner' && client.createdById && client.createdById !== userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const initialActivity = [
      ...(activityLog || []),
      {
        id: `${Date.now()}_activity`,
        type: 'project_created',
        description: `Project "${title}" created`,
        timestamp: new Date().toISOString(),
        details: { clientId, title, stage, budget, priority },
      },
    ];

    const project = await Project.create({
      clientId,
      partnerId: role === 'partner' ? userId : undefined,
      title,
      service,
      stage,
      description,
      budget: budget || 0,
      deadline,
      stageHistory: stageHistory || [
        { stage, date: new Date().toISOString().split('T')[0] },
      ],
      activityLog: initialActivity,
      documents: documents || {},
      meetings: meetings || [],
      totalPayments: 0,
      priority: priority || 'medium',
    });

    res.status(201).json(project);
  } catch (err) {
    console.error('Create project error:', err);
    res.status(500).json({ message: err.message });
  }
};

/** Get all projects */
export const getAllProjects = async (req, res) => {
  try {
    const { id: userId, role } = req.user;

    let filter = {};
    if (role === 'partner') {
      const partnerClients = await Client.find({ createdById: userId }, '_id');
      const clientIds = partnerClients.map((c) => c._id.toString());
      filter = {
        $or: [{ clientId: { $in: clientIds } }, { partnerId: userId }],
      };
    }

    const projects = await Project.find(filter).sort({ createdAt: -1 });

    const clientIds = [...new Set(projects.map((p) => p.clientId).filter(Boolean))];
    const clients = await Client.find({ _id: { $in: clientIds } });
    const clientMap = new Map(clients.map((c) => [c.id, c.toJSON()]));

    const projectIds = projects.map((p) => p.id);
    const payments = await Payment.find({ projectId: { $in: projectIds } });
    const paymentMap = new Map();
    payments.forEach((pay) => {
      const list = paymentMap.get(pay.projectId) || [];
      list.push(pay.toJSON());
      paymentMap.set(pay.projectId, list);
    });

    const result = projects.map((p) => {
      const json = p.toJSON();
      json.client = clientMap.get(p.clientId) || null;
      json.payments = paymentMap.get(p.id) || [];
      return json;
    });

    res.json(result);
  } catch (err) {
    console.error('Get all projects error:', err);
    res.status(500).json({ message: err.message });
  }
};

/** Get project by ID */
export const getProjectById = async (req, res) => {
  try {
    const { id: userId, role } = req.user;
    const project = await Project.findById(req.params.id);

    if (!project) return res.status(404).json({ message: 'Project not found' });

    const client = await Client.findById(project.clientId);
    if (
      role === 'partner' &&
      project.partnerId !== userId &&
      client &&
      client.createdById !== userId
    ) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const payments = await Payment.find({ projectId: project.id });

    const json = project.toJSON();
    json.client = client ? client.toJSON() : null;
    json.payments = payments.map((p) => p.toJSON());

    res.json(json);
  } catch (err) {
    console.error('Get project error:', err);
    res.status(500).json({ message: err.message });
  }
};

/** Get project details */
export const getProjectDetails = async (req, res) => {
  try {
    const { id: userId, role } = req.user;
    const project = await Project.findById(req.params.id);

    if (!project) return res.status(404).json({ message: 'Project not found' });

    const client = await Client.findById(project.clientId);
    if (
      role === 'partner' &&
      project.partnerId !== userId &&
      client &&
      client.createdById !== userId
    ) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({
      project: project.toJSON(),
      documents: project.documents || {},
      activityLog: project.activityLog || [],
      client: client ? client.toJSON() : null,
    });
  } catch (err) {
    console.error('Get project details error:', err);
    res.status(500).json({ message: err.message });
  }
};

/** Update project */
export const updateProject = async (req, res) => {
  try {
    const { id: userId, role } = req.user;
    const { id } = req.params;

    const project = await Project.findById(id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const client = await Client.findById(project.clientId);
    if (
      role === 'partner' &&
      project.partnerId !== userId &&
      client &&
      client.createdById !== userId
    ) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { stage, stageHistory, activityLog, priority, ...rest } = req.body;

    let updatedStageHistory = project.stageHistory || [];
    let updatedActivityLog = [...(project.activityLog || []), ...(activityLog || [])];

    // Stage change
    if (stage && stage !== project.stage) {
      updatedStageHistory.push({ stage, date: new Date().toISOString() });
      updatedActivityLog.push({
        id: `${Date.now()}_activity`,
        type: 'stage_changed',
        description: `Stage changed to "${stage}"`,
        timestamp: new Date().toISOString(),
        details: { oldStage: project.stage, newStage: stage },
      });
    }

    // Priority change
    if (priority && priority !== project.priority) {
      updatedActivityLog.push({
        id: `${Date.now()}_activity`,
        type: 'priority_changed',
        description: `Priority changed to "${priority}"`,
        timestamp: new Date().toISOString(),
        details: { oldPriority: project.priority, newPriority: priority },
      });
    }

    Object.assign(project, rest);
    if (stage) project.stage = stage;
    if (priority) project.priority = priority;
    project.stageHistory = updatedStageHistory;
    project.activityLog = updatedActivityLog;

    await project.save();

    res.json(project);
  } catch (err) {
    console.error('Update project error:', err);
    res.status(500).json({ message: err.message });
  }
};

/** Delete project */
export const deleteProject = async (req, res) => {
  try {
    const { id: userId, role } = req.user;
    const project = await Project.findById(req.params.id);

    if (!project) return res.status(404).json({ message: 'Project not found' });

    const client = await Client.findById(project.clientId);
    if (
      role === 'partner' &&
      project.partnerId !== userId &&
      client &&
      client.createdById !== userId
    ) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Delete files if any
    if (project.documents) {
      Object.values(project.documents).forEach((doc) => {
        if (doc && doc.url) {
          const filePath = path.join(process.cwd(), doc.url);
          fs.unlink(filePath, (err) => {
            if (err) console.error('File deletion error:', err);
          });
        }
      });
    }

    await Project.findByIdAndDelete(req.params.id);
    await Payment.deleteMany({ projectId: req.params.id });

    res.json({ message: 'Project deleted' });
  } catch (err) {
    console.error('Delete project error:', err);
    res.status(500).json({ message: err.message });
  }
};

/** Update project stage */
export const updateProjectStage = async (req, res) => {
  try {
    const { id } = req.params;
    const { stage } = req.body;
    const { id: userId, role } = req.user;

    if (!stage) return res.status(400).json({ message: 'Stage is required' });

    const project = await Project.findById(id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const client = await Client.findById(project.clientId);
    if (
      role === 'partner' &&
      project.partnerId !== userId &&
      client &&
      client.createdById !== userId
    ) {
      return res.status(403).json({ message: 'Access denied' });
    }

    project.stage = stage;

    const history = project.stageHistory || [];
    history.push({
      stage,
      date: new Date().toISOString(),
      notes: `Moved to ${stage}`,
    });
    project.stageHistory = history;

    const activity = project.activityLog || [];
    activity.push({
      id: `${Date.now()}_activity`,
      type: 'stage_updated',
      description: `Project stage updated to "${stage}"`,
      timestamp: new Date().toISOString(),
      details: { newStage: stage },
    });
    project.activityLog = activity;

    await project.save();
    res.json(project);
  } catch (err) {
    console.error('Update stage error:', err);
    res.status(500).json({ message: err.message });
  }
};

/** Upload project document */
export const uploadProjectDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const { docType } = req.body;
    const file = req.file;
    const { id: userId, role } = req.user;

    if (!file) return res.status(400).json({ message: 'No file uploaded' });
    if (!docType) return res.status(400).json({ message: 'docType is required' });

    const project = await Project.findById(id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const client = await Client.findById(project.clientId);
    if (
      role === 'partner' &&
      project.partnerId !== userId &&
      client &&
      client.createdById !== userId
    ) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const fileUrl = `/uploads/projects/${id}/${file.filename}`;
    const documents = { ...(project.documents || {}) };
    const activity = [...(project.activityLog || [])];

    const isUpdate = !!documents[docType];

    documents[docType] = {
      name: file.originalname,
      uploadDate: new Date().toISOString(),
      size: file.size,
      url: fileUrl,
    };

    activity.push({
      id: `${Date.now()}_activity`,
      type: isUpdate ? 'document_update' : 'document_upload',
      description: `${isUpdate ? 'Updated' : 'Uploaded'} ${docType}`,
      timestamp: new Date().toISOString(),
      details: { documentType: docType, documentName: file.originalname },
    });

    project.documents = documents;
    project.activityLog = activity;
    project.markModified('documents');
    project.markModified('activityLog');

    await project.save();

    res.json({
      message: 'Document uploaded successfully',
      documents: project.documents,
      activityLog: project.activityLog,
    });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ message: err.message });
  }
};

/** Delete project document */
export const deleteProjectDocument = async (req, res) => {
  try {
    const { id, docType } = req.params;
    const { id: userId, role } = req.user;

    const project = await Project.findById(id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const client = await Client.findById(project.clientId);
    if (
      role === 'partner' &&
      project.partnerId !== userId &&
      client &&
      client.createdById !== userId
    ) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const documents = { ...(project.documents || {}) };
    const existing = documents[docType];
    if (!existing) return res.status(404).json({ message: 'Document not found' });

    if (existing.url) {
      const filePath = path.join(process.cwd(), existing.url);
      fs.unlink(filePath, (err) => {
        if (err) console.error('Failed to delete file:', err);
      });
    }

    delete documents[docType];

    const activity = [...(project.activityLog || [])];
    activity.push({
      id: `${Date.now()}_activity`,
      type: 'document_delete',
      description: `Deleted ${docType}`,
      timestamp: new Date().toISOString(),
      details: { documentType: docType, documentName: existing.name },
    });

    project.documents = documents;
    project.activityLog = activity;
    project.markModified('documents');
    project.markModified('activityLog');

    await project.save();

    res.json({
      documents: project.documents,
      activityLog: project.activityLog,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

/** Add project meeting */
export const addProjectMeeting = async (req, res) => {
  try {
    const { id } = req.params;
    const { date, time, title, notes } = req.body;
    const { id: userId, role } = req.user;

    if (!date || !time || !title) {
      return res.status(400).json({ message: 'date, time, and title are required' });
    }

    const project = await Project.findById(id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const client = await Client.findById(project.clientId);
    if (
      role === 'partner' &&
      project.partnerId !== userId &&
      client &&
      client.createdById !== userId
    ) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const meetings = [...(project.meetings || [])];
    const meeting = { id: `${Date.now()}`, date, time, title, notes };
    meetings.push(meeting);

    const activity = [...(project.activityLog || [])];
    activity.push({
      id: `${Date.now()}_activity`,
      type: 'meeting_added',
      description: `Meeting scheduled: ${title}`,
      timestamp: new Date().toISOString(),
      details: { meetingTitle: title, meetingDate: date, meetingTime: time },
    });

    project.meetings = meetings;
    project.activityLog = activity;
    project.markModified('meetings');
    project.markModified('activityLog');

    await project.save();

    res.status(201).json({ meetings: project.meetings, activityLog: project.activityLog });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};