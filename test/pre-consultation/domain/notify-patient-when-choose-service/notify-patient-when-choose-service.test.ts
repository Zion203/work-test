import { describe, test, expect, vi } from "vitest";
import { NotifyPatientWhenChooseServiceCommand } from "../../../../src/core/application/command/notify-patient-when-choose-service/notify-patient-when-choose-service-command.js";
import { notifyPatientAboutPreConsultation } from "../../../../src/core/domain/model/functions/notify-patient-when-choose-service.js";
import {
  aggregate,
  mockInquiryServiceGatewayForInquiryDetail,
  mockNotificationServiceGateway,
} from "../../../fixtures.js";  
import { mockPreConsultationReadRepositoryForNotificationTemplate } from "../../../pre-consultation-repo-fixtures.js";
import { NotifyPatientWhenChooseService } from "../../../../src/core/domain/events/notify-patient-when-choose-service.js";

vi.mock("ulid", () => ({
  ulid: vi.fn(() => "mockedUlid"),
}));
describe("NotifyPatientWhenChooseService", () => {
  test("should NotifyPatientWhenChooseService", async () => {
    const NotifyPatientWhenChooseServiceCommand: NotifyPatientWhenChooseServiceCommand =
      {
        id: "mockedUlid",
        name: "NotifyPatientWhenChooseServiceCommand",
        createdBy: "12333",
        aggregateName: "PreConsultation",
        aggregateId: "45",
        source: {
          type: "APP",
          userId: "23",
        },
        retry: 1,
        aggregateVersion: 1,
        workflowInstanceId: "testId",
        description: "testDesc",
        IRN: "IRN",
      };

    const notificationServiceGateway = mockNotificationServiceGateway();
    const PrecousultationReadRepositoryForNotificationTemplate =
    mockPreConsultationReadRepositoryForNotificationTemplate();
    const inquiryServiceGateway = mockInquiryServiceGatewayForInquiryDetail();
    const result = await notifyPatientAboutPreConsultation(
      NotifyPatientWhenChooseServiceCommand,
      aggregate,
      notificationServiceGateway,
      PrecousultationReadRepositoryForNotificationTemplate,
      inquiryServiceGateway
    );

    const patientNotifiedAboutPrecousultationApproval: NotifyPatientWhenChooseService =
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
          name: "NotifyPatientWhenChooseService",
          comments: NotifyPatientWhenChooseServiceCommand.description!,
        },
        PreConsultationNotification: {
            NOTIFICATION_SERVICE_TO_PATIENT: {
            notificationId: "98999933334444",
            notificationType: "NOTIFICATION_SERVICE_TO_PATIENT",
            notifiedDate: expect.any(Date),
          },
        },
      };
    expect(result.isOk).is.true;
    if (result.isOk) {
      expect(result.value).toEqual(patientNotifiedAboutPrecousultationApproval);
    }
  });
});
