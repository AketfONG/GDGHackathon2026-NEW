import { Schema, model, models, Types } from "mongoose";

const icsEventSchema = new Schema(
  {
    uid: { type: String, required: true },
    title: { type: String, required: true },
    start: { type: Date, required: true },
    end: { type: Date, required: true },
    location: { type: String, default: null },
  },
  { _id: false },
);

const calendarImportSchema = new Schema(
  {
    userId: { type: Types.ObjectId, ref: "User", required: true, unique: true, index: true },
    fileName: { type: String, default: "calendar.ics" },
    importedAt: { type: Date, default: () => new Date() },
    events: { type: [icsEventSchema], default: [] },
  },
  { timestamps: true },
);

export const CalendarImportModel =
  models.CalendarImport || model("CalendarImport", calendarImportSchema);
