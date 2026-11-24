import mongoose, { Schema, models, model } from "mongoose";

const QuizQuestionSchema = new Schema({
  question: String,
  options: [String],
  correctIndex: Number,
});

const ModuleSchema = new Schema({
  id: Number,
  title: String,
  summary: String,
  searchQuery: String,
  keyTakeaways: [String],
  videoId: String,
  channelTitle: String,
  thumbnail: String,
  quiz: [QuizQuestionSchema],
  completed: { type: Boolean, default: false },
  unlocked: { type: Boolean, default: false },
});

const CourseSchema = new Schema(
  {
    id: { type: String, required: true, unique: true },
    topic: { type: String, required: true },
    level: { type: String, required: true },
    duration: { type: String, required: true },
    description: { type: String },
    modules: [ModuleSchema],
  },
  { timestamps: true }
);

export const CourseModel = models.Course || model("Course", CourseSchema);
