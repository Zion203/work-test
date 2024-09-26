import type { DomainEvent } from "@icliniqSmartDoctor/reactive-framework";
import type {
  PreConsultation,
  PreConsultationAssignment,
} from "../model/types/pre-consultation-aggregate.js";

export type MoReAssigned = DomainEvent<PreConsultation, "MoReAssigned"> & {
  assignments: PreConsultationAssignment;
};
