import type { DomainEvent } from "@icliniqSmartDoctor/reactive-framework";
import type {
  PreConsultation,
  Service,
} from "../model/types/pre-consultation-aggregate.js";

export type ServiceSelectionSubmitted = DomainEvent<
  PreConsultation,
  "ServiceSelectionSubmitted"
> & {
  inquiryId: string;
  IRN: string;
  services: Service[];
};


