import type { DomainEvent } from "@icliniqSmartDoctor/reactive-framework";
import type {
  PreConsultation,
  PreConsultationAssignment,
} from "../model/types/pre-consultation-aggregate.js";

export type MoAssigned = DomainEvent<PreConsultation, "MoAssigned"> & {
  assignments: PreConsultationAssignment;
};
