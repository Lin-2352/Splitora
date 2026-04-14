import mongoose, { Schema, Document } from "mongoose";

/* ------------------------------------------------------------------ */
/*  Sub-schemas                                                        */
/* ------------------------------------------------------------------ */
const chatMessageSchema = new Schema(
  {
    role: {
      type: String,
      enum: ["user", "assistant"],
      required: true,
    },
    content: {
      type: String,
      required: true,
      maxlength: 4000,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const chatSessionSchema = new Schema(
  {
    sessionId: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      default: "New Chat",
      maxlength: 120,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    messages: {
      type: [chatMessageSchema],
      default: [],
      validate: {
        validator: (arr: unknown[]) => arr.length <= 60,
        message: "A session cannot have more than 60 messages",
      },
    },
  },
  { _id: false }
);

/* ------------------------------------------------------------------ */
/*  Main schema — one document per user                                */
/* ------------------------------------------------------------------ */
export interface IChatHistory extends Document {
  userId: mongoose.Types.ObjectId;
  sessions: {
    sessionId: string;
    title: string;
    createdAt: Date;
    messages: {
      role: "user" | "assistant";
      content: string;
      timestamp: Date;
    }[];
  }[];
  updatedAt: Date;
  createdAt: Date;
}

const chatHistorySchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    sessions: {
      type: [chatSessionSchema],
      default: [],
      validate: {
        validator: (arr: unknown[]) => arr.length <= 30,
        message: "Cannot store more than 30 sessions",
      },
    },
  },
  { timestamps: true }
);

export default mongoose.models.ChatHistory ||
  mongoose.model<IChatHistory>("ChatHistory", chatHistorySchema);
