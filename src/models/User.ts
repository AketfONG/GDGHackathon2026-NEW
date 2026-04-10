import { Schema, model, models } from "mongoose";

export type UserRole = "STUDENT" | "ADMIN";

const userSchema = new Schema(
  {
    firebaseUid: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true },
    role: { type: String, enum: ["STUDENT", "ADMIN"], default: "STUDENT" },
    goal: { type: String, default: null },
  },
  { timestamps: true },
);

export const UserModel = models.User || model("User", userSchema);
