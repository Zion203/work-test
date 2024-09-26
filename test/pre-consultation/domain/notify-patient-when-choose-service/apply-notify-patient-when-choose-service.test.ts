import { describe, test, expect, vi } from "vitest";
import { NotifyPatientWhenChooseService } from "../../../../src/core/domain/events/notify-patient-when-choose-service";
import { aggregate } from "../../../fixtures";
import { applyPatientNotifiedAboutPreConsultation } from "../../../../src/core/domain/model/functions/notify-patient-when-choose-service";

describe("applyPatientNotifiedAboutPreConsultationApproval", () => {
  test("should applyPatientNotifiedAboutPreConsultationApproval", async () => {
    const patientNotifiedAboutPreConsultationApproval: NotifyPatientWhenChooseService =
      {
        id: "mockedUlid",
        name: "NotifyPatientWhenChooseService",
        createdOn: expect.any(Date),
        createdBy: "12333",
        aggregateId: "45",
        aggregateName: "PreConsultation",
        workflowInstanceId: "testId",
        aggregateVersion: 1,
        sourceCommand: {
          name: "NotifyPatientAboutPreConsultationApproval",
          comments: "testDesc",
        },
        PreConsultationNotification: {
            NOTIFICATION_SERVICE_TO_PATIENT: {
            notificationId: "98999933334444",
            notificationType: "NOTIFICATION_SERVICE_TO_PATIENT",
            notifiedDate: expect.any(Date),
          },
        },
      };

      const result = await applyPatientNotifiedAboutPreConsultation(aggregate, patientNotifiedAboutPreConsultationApproval);

      if(result) {
        expect(result).toEqual({
          ...aggregate,
          isNew: false,
          PreConsultationNotifications: patientNotifiedAboutPreConsultationApproval.PreConsultationNotification,
          versionComments: patientNotifiedAboutPreConsultationApproval.sourceCommand.comments,
          auditHistory: new Set([
            ...aggregate.auditHistory,
            {
              commandName: patientNotifiedAboutPreConsultationApproval.sourceCommand.name,
              comments: patientNotifiedAboutPreConsultationApproval.sourceCommand.comments,
              createdBy: patientNotifiedAboutPreConsultationApproval.createdBy,
              timestamp: expect.any(Date),
              version: patientNotifiedAboutPreConsultationApproval.aggregateVersion,
            },
          ]),
        });
      }
  });
});
