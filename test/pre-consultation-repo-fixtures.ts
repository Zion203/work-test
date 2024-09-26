import { Result } from "true-myth";
import { PreConsultationNotificationType } from "../src/core/application/command/notify-patient-when-choose-service/notify-patient-when-choose-service-handler";
import {
  PreConsultationNotificationTemplateError,
  PreConsultationNotificationTemplateResponse,
  PreConsultationReadRepository,
  GetPreConsultationByIrnError,
  NotificationKeys,
  PreConsultationAssignmentError,
  PreConsultationAssignmentResponse,
  
} from "../src/core/ports/pre-consultation-ports";
import type { PreConsultationAssignment } from "../src/core/application/command/assign-mo/assign-mo-handler";

import { PreConsultation } from "../src/core/domain/model/types/pre-consultation-aggregate";

export const mockPreConsultationReadRepositoryForNotificationTemplate =
  (): PreConsultationReadRepository => {
    return {
      getPreConsultationByIrn: (
        irn: string
      ): Promise<Result<PreConsultation[], GetPreConsultationByIrnError>> => {
        return Promise.reject("not applicable");
      },
      getPreConsultationAssignment: (
        preConsultationAssignment: PreConsultationAssignment
      ) : Promise<
      Result<PreConsultationAssignmentResponse[], PreConsultationAssignmentError>>  => {
        return Promise.reject("not applicable");
      } ,
      getPreConsultationNotificationTemplate: (
        PreConsultationNotificationType: PreConsultationNotificationType
      ): Promise<
        Result<
          PreConsultationNotificationTemplateResponse[],
          PreConsultationNotificationTemplateError
        >
      > => {
        const response: PreConsultationNotificationTemplateResponse[] = [
          {
            notificationSubject:
              "MSK India - MT Assignment Notification (IRN: #{{IRN}})",
            notificationTemplate:
              "Hi,\\nThis is to inform you that a Medical Team doctor (MT) has been assigned to a case in the system on ${{dateTime}}. \n" +
              "Below are the details:\\nPatient Name: ${{firstName}} ${{lastName}}\\n\n" +
              "Assigned MT: ${{assignedMT}}\\n\\n\n" +
              "Please review the case details and provide a slot for the CIF call so we can proceed further.\n" +
              "\\n\\nRespectfully,\\nMSK India Team",
            notificationKeys: {
              PreConsultation: ["firstName", "lastName", "IRN"] ?? [],
              notification: ["assignedMT", "dateTime"] ?? [],
            } as unknown as NotificationKeys,
            daySchedule: 0,
          },
        ];
        return Promise.resolve(Result.ok(response));
      },
    };
  };
