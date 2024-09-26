import type { Command } from "@icliniqSmartDoctor/reactive-framework";
import type { Service } from "../../../domain/model/types/pre-consultation-aggregate.js";

export type SubmitServiceSelection = Command<"SubmitServiceSelection"> & {
  IRN: string;
  inquiryId: string;
  services: Service[];
};
