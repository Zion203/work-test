import type { DataClient } from "@icliniqSmartDoctor/reactive-framework";
import type {
  PreConsultationNotificationTemplateError,
  PreConsultationNotificationTemplateResponse,
  PreConsultationReadRepository,
  PreConsultationAssignmentError,
  PreConsultationAssignmentResponse,
  GetPreConsultationByIrnError,
} from "../../../core/ports/pre-consultation-ports.js";
import type { PreConsultation } from "../../../core/domain/model/types/pre-consultation-aggregate.js";
import { Result } from "true-myth";
import { readPreConsultationByIrn } from "./read-pre-consultation-by-irn.js";
import type { PreConsultationNotificationType } from "../../../core/application/command/notify-patient-when-choose-service/notify-patient-when-choose-service-handler.js";
import { fetchPreConsultationNotificationTemplate } from "./read-pre-consultation-notification.js";
import { fetchPreConsultationAssignment } from "./read-pre-consultation-assignment.js";
import type { PreConsultationAssignment } from "../../../core/application/command/assign-mo/assign-mo-handler.js";

export const preConsultationReadRepo = (
  dataClient: DataClient
): PreConsultationReadRepository => ({
  getPreConsultationByIrn: async (
    IRN: string
  ): Promise<Result<PreConsultation[], GetPreConsultationByIrnError>> => {
    const readPreConsultationByIrnResponse = await readPreConsultationByIrn(
      dataClient,
      IRN
    );

    if (readPreConsultationByIrnResponse.isErr) {
      return Result.err(readPreConsultationByIrnResponse.error);
    }

    return Result.ok(readPreConsultationByIrnResponse.value);
  },
  getPreConsultationAssignment: async (
    preConsultationAssignment: PreConsultationAssignment
  ): Promise<
    Result<PreConsultationAssignmentResponse[], PreConsultationAssignmentError>> => {
    return fetchPreConsultationAssignment(
      preConsultationAssignment,
      dataClient
    );
  },  
  getPreConsultationNotificationTemplate: async(PreConsultationNotificationType: PreConsultationNotificationType): Promise<Result<PreConsultationNotificationTemplateResponse[], PreConsultationNotificationTemplateError>> => {
    return fetchPreConsultationNotificationTemplate(PreConsultationNotificationType, dataClient);
  }
});
