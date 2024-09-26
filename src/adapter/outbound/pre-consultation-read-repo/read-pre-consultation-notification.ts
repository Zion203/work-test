import { Result } from "true-myth";
import { query, type DataClient } from "@icliniqSmartDoctor/reactive-framework";

import { preConsultationNotification } from "../collections.js";
import type { PreConsultationNotificationType } from "../../../core/application/command/notify-patient-when-choose-service/notify-patient-when-choose-service-handler.js";
import type { PreConsultationNotificationTemplateError,PreConsultationNotificationTemplateNotFoundError,PreConsultationNotificationTemplateResponse , PreConsultationNotificationTemplateUnknownError} from "../../../core/ports/pre-consultation-ports.js";

export const fetchPreConsultationNotificationTemplate = async (
  PreConsultationNotificationType: PreConsultationNotificationType,
  dataClient: DataClient
): Promise<
  Result<
    PreConsultationNotificationTemplateResponse[],
    PreConsultationNotificationTemplateError
  >
> => {
  try {
    const queryFilters = createQueryFilters(PreConsultationNotificationType);
    const queryFields = [
      "id",
      "notificationSubject",
      "notificationTemplate",
      "notificationKeys",
      "daySchedule"
    ];

    const queryResult = await query(dataClient, {
      collectionName: preConsultationNotification,
      fieldsToGet: queryFields,
      filters: queryFilters,
    });

    if (queryResult.isErr) {
      return Result.err(queryResult.error);
    }

    const queryResultValue =
      queryResult.value as unknown as PreConsultationNotificationTemplateResponse[];

    if (queryResultValue.length === 0)
      Result.err(
        PreConsultationNotificationTemplateNotFoundError(PreConsultationNotificationType)
      );

    return Result.ok(queryResultValue);
  } catch (error) {
    const unknownError = preConsultationNotificationTemplateUnknownError(error);
    return Result.err(unknownError);
  }
};

const createQueryFilters = (
  PreConsultationNotificationType: PreConsultationNotificationType
) => ({
  additional: [
    {
      value: PreConsultationNotificationType.notificationType,
      type: "_eq",
      field: "notificationType",
    },
  ],
});

export const preConsultationNotificationTemplateUnknownError = (
  error: unknown
): PreConsultationNotificationTemplateUnknownError => {
  return {
    type: "IOError",
    error: {
      type: "PreConsultationNotificationTemplateUnknownError",
      code: "CH-APP-ADP-INUE",
      description: "Error occurred while fetching unknown Error",
      data: error,
      systemError: new Error("Error occurred while fetching case history"),
    },
    subtype: "NotFound",
    severity: "HIGH",
  };
};

const PreConsultationNotificationTemplateNotFoundError = (
  PreConsultationNotificationType: PreConsultationNotificationType
): PreConsultationNotificationTemplateNotFoundError => {
  return {
    type: "IOError",
    error: {
      type: "PreConsultationNotificationTemplateNotFoundError",
      code: "CH-APP-ADP-INTNFE",
      description: "Case history Notification Template not found",
      data: PreConsultationNotificationType,
      systemError: new Error("Case history Notification Template not found"),
    },
    subtype: "NotFound",
    severity: "HIGH",
  };
};
