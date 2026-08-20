import mongoose from 'mongoose';
import Project from './Project.js';
import Client from './Client.js';

const PaymentSchema = new mongoose.Schema(
  {
    amount: {
      type: Number,
      required: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    description: {
      type: String,
    },
    status: {
      type: String,
      enum: ['paid', 'pending', 'overdue'],
      default: 'pending',
    },
    clientId: {
      type: String,
      ref: 'Client',
      required: true,
    },
    projectId: {
      type: String,
      ref: 'Project',
    },
    clientName: {
      type: String,
    },
    projectTitle: {
      type: String,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

export const updatePaymentTotals = async (clientId, projectId) => {
  try {
    if (projectId) {
      const projectPayments = await Payment.find({ projectId, status: 'paid' });
      const total = projectPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
      await Project.findByIdAndUpdate(projectId, { totalPayments: total });
    }

    if (clientId) {
      const clientPayments = await Payment.find({ clientId, status: 'paid' });
      const total = clientPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
      await Client.findByIdAndUpdate(clientId, { totalPayments: total });
    }
  } catch (err) {
    console.error('Error updating payment totals:', err);
  }
};

PaymentSchema.post('save', async function (doc) {
  await updatePaymentTotals(doc.clientId, doc.projectId);
});

PaymentSchema.post('findOneAndDelete', async function (doc) {
  if (doc) {
    await updatePaymentTotals(doc.clientId, doc.projectId);
  }
});

const Payment = mongoose.models.Payment || mongoose.model('Payment', PaymentSchema);

export default Payment;
