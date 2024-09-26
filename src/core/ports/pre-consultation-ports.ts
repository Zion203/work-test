import { Result } from "true-myth";
import type { PreConsultation } from "../domain/model/types/pre-consultation-aggregate.js";
import type { IOError, IOErrorObject } from "@icliniqSmartDoctor/shared-kernel";
import type { PreConsultationAssignment } from "../application/command/assign-mo/assign-mo-handler.js";
import type { PreConsultationNotificationType
 } from "../application/command/notify-patient-when-choose-service/notify-patient-when-choose-service-handler.js";

export type PreConsultationAssignmentResponse = {
  irn: string;
  assignedUserId: string;
};

export type PreConsultationAssignmentUnknownError = IOError<
  IOErrorObject<"PreConsultationAssignmentUnknownError", "PC-APP-ADP-PCAUE">
>;
export type PreConsultationAssignmentError =
  | PreConsultationAssignmentUnknownError
  | IOError<IOErrorObject>;

export type PreConsultationByIrnUnknownError = IOError<
  IOErrorObject<"PreConsultationByIrnUnknownError", "PC-APP-ADP-PCBIUE">
>;
export type GetPreConsultationByIrnError =
  | IOError<IOErrorObject>
  | PreConsultationByIrnUnknownError;

export type PreConsultationReadRepository = {
  getPreConsultationByIrn: (
    irn: string
  ) => Promise<Result<PreConsultation[], GetPreConsultationByIrnError>>;
  getPreConsultationAssignment: (
    preConsultationAssignment: PreConsultationAssignment
  ) => Promise<
    Result<PreConsultationAssignmentResponse[], PreConsultationAssignmentError>
  >;
  getPreConsultationNotificationTemplate: (
    preConsultationNotificationType: PreConsultationNotificationType
  ) => Promise<
    Result<
      PreConsultationNotificationTemplateResponse[],
      PreConsultationNotificationTemplateError
    >
  >;

};

export type PreConsultationNotificationTemplateUnknownError = IOError<
  IOErrorObject<"PreConsultationNotificationTemplateUnknownError", "CH-APP-ADP-INUE">
>;

export type PreConsultationNotificationTemplateNotFoundError = IOError<
  IOErrorObject<
    "PreConsultationNotificationTemplateNotFoundError",
    "CH-APP-ADP-INTNFE"
  >
>;

export type PreConsultationNotificationTemplateError =
  | IOError<IOErrorObject>
  | PreConsultationNotificationTemplateNotFoundError;

export type NotificationKeys = {
  [key in NotificationType]?: [];
};
type NotificationType = "PreConsultation" | "notification";

export type PreConsultationNotificationTemplateResponse = {
  notificationSubject: string;
  notificationTemplate: string;
  notificationKeys: NotificationKeys;
  daySchedule: number;
};
