import Project from "../models/Project.js";
import Client from "../models/Client.js";
import Payment from "../models/Payment.js";
import path from "path";
import fs from "fs";

/** Create project */
export const createProject = async (req, res) => {
  try {
    const { id: userId, role } = req.user;
    const {
      clientId,
      title,
      service,
      stage,
      description,
      budget,
      deadline,
      stageHistory,
      activityLog,
      documents,
      meetings,
      priority,
    } = req.body;

    const client = await Client.findByPk(clientId);
    if (!client) return res.status(404).json({ message: "Client not found" });

    // Partner can only create projects for clients they created
    if (role === "partner" && client.createdById !== userId) {
      return res.status(403).json({ message: "Access denied" });
    }

    const initialActivity = [
      ...(activityLog || []),
      {
        id: `${Date.now()}_activity`,
        type: "project_created",
        description: `Project "${title}" created`,
        timestamp: new Date().toISOString(),
        details: { clientId, title, stage, budget, priority },
      },
    ];

    const project = await Project.create({
      clientId,
      title,
      service,
      stage,
      description,
      budget,
      deadline,
      stageHistory: stageHistory || [
        { stage, date: new Date().toISOString().split("T")[0] },
      ],
      activityLog: initialActivity,
      documents: documents || {},
      meetings: meetings || [],
      totalPayments: 0,
      priority: priority || "normal", // Default priority if not provided
    });

    res.status(201).json(project);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

/** Get all projects */
export const getAllProjects = async (req, res) => {
  try {
    const { id: userId, role } = req.user;

    const whereClause = {};
    if (role === "partner") {
      // Only projects whose client was created by partner
      whereClause["$client.createdById$"] = userId;
    }

    const projects = await Project.findAll({
      include: [
        { model: Client, as: "client" },
        { model: Payment, as: "payments" },
      ],
      where: whereClause,
      order: [["createdAt", "DESC"]],
    });

    res.json(projects);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

/** Get project by ID */
export const getProjectById = async (req, res) => {
  try {
    const { id: userId, role } = req.user;
    const project = await Project.findByPk(req.params.id, {
      include: [
        { model: Client, as: "client" },
        { model: Payment, as: "payments" },
      ],
    });

    if (!project) return res.status(404).json({ message: "Project not found" });

    if (role === "partner" && project.client.createdById !== userId) {
      return res.status(403).json({ message: "Access denied" });
    }

    res.json(project);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

/** Get project details */
export const getProjectDetails = async (req, res) => {
  try {
    const { id: userId, role } = req.user;
    const project = await Project.findByPk(req.params.id, {
      include: [
        { model: Client, as: "client" },
        { model: Payment, as: "payments", order: [["createdAt", "DESC"]] },
      ],
    });

    if (!project) return res.status(404).json({ message: "Project not found" });

    if (role === "partner" && project.client.createdById !== userId) {
      return res.status(403).json({ message: "Access denied" });
    }

    res.json({
      project: project.toJSON(),
      documents: project.documents || {},
      activityLog: project.activityLog || [],
      client: project.client || null,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

/** Update project */
export const updateProject = async (req, res) => {
  try {
    const { id: userId, role } = req.user;
    const { id } = req.params;

    const project = await Project.findByPk(id, {
      include: [{ model: Client, as: "client" }],
    });
    if (!project) return res.status(404).json({ message: "Project not found" });

    if (role === "partner" && project.client.createdById !== userId) {
      return res.status(403).json({ message: "Access denied" });
    }

    const { stage, stageHistory, activityLog, priority, ...rest } = req.body;

    // Update stageHistory if stage changed
    let updatedStageHistory = project.stageHistory || [];
    let updatedActivityLog = [...(project.activityLog || []), ...(activityLog || [])];

    // Stage change
    if (stage && stage !== project.stage) {
      updatedStageHistory.push({ stage, date: new Date().toISOString() });
      updatedActivityLog.push({
        id: `${Date.now()}_activity`,
        type: "stage_changed",
        description: `Stage changed to "${stage}"`,
        timestamp: new Date().toISOString(),
        details: { oldStage: project.stage, newStage: stage },
      });
    }

    // Priority change
    if (priority && priority !== project.priority) {
      updatedActivityLog.push({
        id: `${Date.now()}_activity`,
        type: "priority_changed",
        description: `Priority changed to "${priority}"`,
        timestamp: new Date().toISOString(),
        details: { oldPriority: project.priority, newPriority: priority },
      });
    }

    await project.update({
      ...rest,
      stage: stage || project.stage,
      stageHistory: updatedStageHistory,
      activityLog: updatedActivityLog,
      priority: priority || project.priority,
    });

    res.json(project);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

/** Delete project */
export const deleteProject = async (req, res) => {
  try {
    const { id: userId, role } = req.user;
    const project = await Project.findByPk(req.params.id, {
      include: [{ model: Client, as: "client" }],
    });

    if (!project) return res.status(404).json({ message: "Project not found" });

    if (role === "partner" && project.client.createdById !== userId) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Log deletion activity
    const activityLog = project.activityLog || [];
    activityLog.push({
      id: `${Date.now()}_activity`,
      type: "project_deleted",
      description: `Project "${project.title}" deleted`,
      timestamp: new Date().toISOString(),
      details: { projectId: project.id },
    });

    // Delete files if any
    if (project.documents) {
      Object.values(project.documents).forEach((doc) => {
        const filePath = path.join(process.cwd(), doc.url);
        fs.unlink(filePath, (err) => {
          if (err) console.error("File deletion error:", err);
        });
      });
    }

    await project.destroy();
    res.json({ message: "Project deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

/** Update project stage */
export const updateProjectStage = async (req, res) => {
  try {
    const { id } = req.params;
    const { stage } = req.body;
    const { id: userId, role } = req.user;

    if (!stage) return res.status(400).json({ message: "Stage is required" });

    const project = await Project.findByPk(id, {
      include: [{ model: Client, as: "client" }],
    });
    if (!project) return res.status(404).json({ message: "Project not found" });

    // Allow partners to update only their own projects
    if (role === "partner" && project.client.createdById !== userId) {
      return res.status(403).json({ message: "Access denied" });
    }

    // update stage
    project.stage = stage;

    // update stage history
    const history = project.stageHistory || [];
    history.push({
      stage,
      date: new Date().toISOString(),
      notes: `Moved to ${stage}`,
    });
    project.stageHistory = history;

    // Add activity log
    const activity = project.activityLog || [];
    activity.push({
      id: `${Date.now()}_activity`,
      type: "stage_updated",
      description: `Project stage updated to "${stage}"`,
      timestamp: new Date().toISOString(),
      details: { newStage: stage },
    });
    project.activityLog = activity;

    await project.save();
    res.json(project);
  } catch (err) {
    console.error(err);
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

    if (!file) return res.status(400).json({ message: "No file uploaded" });
    if (!docType)
      return res.status(400).json({ message: "docType is required" });

    const project = await Project.findByPk(id, {
      include: [{ model: Client, as: "client" }],
    });

    if (!project) return res.status(404).json({ message: "Project not found" });

    if (role === "partner" && project.client.createdById !== userId) {
      return res.status(403).json({ message: "Access denied" });
    }

    const fileUrl = `/uploads/projects/${id}/${file.filename}`;

    // Safely initialize JSON fields
    const documents = project.documents || {};
    const activity = project.activityLog || [];

    const isUpdate = !!documents[docType];

    // Update document info
    documents[docType] = {
      name: file.originalname,
      uploadDate: new Date().toISOString(),
      size: file.size,
      url: fileUrl,
    };

    // Add to activity log
    activity.push({
      id: `${Date.now()}_activity`,
      type: isUpdate ? "document_update" : "document_upload",
      description: `${isUpdate ? "Updated" : "Uploaded"} ${docType}`,
      timestamp: new Date().toISOString(),
      details: { documentType: docType, documentName: file.originalname },
    });

    // Tell Sequelize these fields changed (important!)
    project.set({ documents, activityLog: activity });
    project.changed("documents", true);
    project.changed("activityLog", true);

    await project.save();

    res.json({
      message: "Document uploaded successfully",
      documents: project.documents,
      activityLog: project.activityLog,
    });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ message: err.message });
  }
};

/** Delete project document */
export const deleteProjectDocument = async (req, res) => {
  try {
    const { id, docType } = req.params;
    const { id: userId, role } = req.user;

    const project = await Project.findByPk(id, {
      include: [{ model: Client, as: "client" }],
    });
    if (!project) return res.status(404).json({ message: "Project not found" });

    if (role === "partner" && project.client.createdById !== userId) {
      return res.status(403).json({ message: "Access denied" });
    }

    const documents = { ...(project.documents || {}) };
    const existing = documents[docType];
    if (!existing)
      return res.status(404).json({ message: "Document not found" });

    // Delete file from local filesystem
    const filePath = path.join(process.cwd(), existing.url); // ensure correct absolute path
    fs.unlink(filePath, (err) => {
      if (err) {
        console.error("Failed to delete file:", err);
      } else {
        console.log("File deleted:", filePath);
      }
    });

    // Remove from database
    delete documents[docType];

    const activity = project.activityLog || [];
    activity.push({
      id: `${Date.now()}_activity`,
      type: "document_delete",
      description: `Deleted ${docType}`,
      timestamp: new Date().toISOString(),
      details: { documentType: docType, documentName: existing.name },
    });

    project.documents = documents;
    project.activityLog = activity;
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

    if (!date || !time || !title)
      return res
        .status(400)
        .json({ message: "date, time, and title are required" });

    const project = await Project.findByPk(id, {
      include: [{ model: Client, as: "client" }],
    });
    if (!project) return res.status(404).json({ message: "Project not found" });

    if (role === "partner" && project.client.createdById !== userId) {
      return res.status(403).json({ message: "Access denied" });
    }

    const meetings = project.meetings || [];
    const meeting = { id: `${Date.now()}`, date, time, title, notes };
    meetings.push(meeting);

    const activity = project.activityLog || [];
    activity.push({
      id: `${Date.now()}_activity`,
      type: "meeting_added",
      description: `Meeting scheduled: ${title}`,
      timestamp: new Date().toISOString(),
      details: { meetingTitle: title, meetingDate: date, meetingTime: time },
    });

    project.meetings = meetings;
    project.activityLog = activity;
    await project.save();

    res
      .status(201)
      .json({ meetings: project.meetings, activityLog: project.activityLog });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};