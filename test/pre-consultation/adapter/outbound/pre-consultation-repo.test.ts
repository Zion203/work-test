import { describe, expect, test, it, vi } from "vitest";
import {
  domainToDataMapper,
  dataToDomainMapper,
} from "../../../../src/adapter/outbound/pre-consultation-repo.js";
import {
  samplePreConsultation,
  samplePreConsultationDataModel,
} from "../../../fixtures.js";
import { DataModel } from "@icliniqSmartDoctor/reactive-framework";
import {
  preConsultationPreConsultation,
  preConsultationAssignment,
  preConsultationNotification,
  preConsultationMedicalReport,
  preConsultationPatientGovtIdentification,
  preConsultationReminder,
} from "../../../../src/adapter/outbound/collections.js";
import {
  getAssignmentDataToSave,
  getMedicalReportsDataToSave,
  getNotificationDataToSave,
  getPatientGovtIdsDataToSave,
  getRemindersDataToSave,
} from "../../../../src/adapter/outbound/pre-consultation-repo-directus.js";
import { PreConsultation } from "../../../../src/core/domain/model/types/pre-consultation-aggregate.js";

vi.mock("ulid", () => {
  return {
    ulid: vi.fn(() => "01ARZ3NDEKTSV4RRFFQ69G5FAV"),
  };
});

const preConsultation = samplePreConsultation();
const dataModel = samplePreConsultationDataModel();

describe("DomainToDataMapper", () => {
  test("should map consultation to DataModel", () => {
    const expectedDataModel: DataModel = {
      aggregateRootCollectionName: preConsultationPreConsultation,
      aggregateRootValues: {
        id: preConsultation.id,
        name: preConsultation.name,
        version: preConsultation.version,
        comments: preConsultation.versionComments ?? ("" as string),
        auditHistory: {
          history: [...preConsultation.auditHistory],
        },
        inquiryId: preConsultation.inquiryId,
        IRN: preConsultation.IRN,
        services: preConsultation.services.map((service) => service.name),

        ...preConsultation.services.reduce(
          (accualPreConsultationData, service) => {
            switch (service.name) {
              case "VIDEO_CONSULTATION":
              case "WRITTEN_CONSULTATION":
                return {
                  ...accualPreConsultationData,
                  preferredPhysicianName: service.preferredPhysicianName,
                  supplimentaryServices: service.supplimentaryServices?.map(
                    (supplimentaryService) => supplimentaryService.name
                  ),
                  isMultiMdConsult: service.isMultiMdConsult,
                };

              case "PATHOLOGY_REVIEW":
                return {
                  ...accualPreConsultationData,
                  slideType: service.slideType.type,

                  ...(service.slideType.type !== "NONE" && {
                    pathologyType: service.slideType.pathologyType.type,
                    courierType:
                      service.slideType.pathologyType.courierDetails
                        .courierType,

                    ...(service.slideType.pathologyType.courierDetails
                      .courierType === "SELF_COURIER" && {
                      trackingId:
                        service.slideType.pathologyType.courierDetails
                          .trackingId,
                      contactPersonName:
                        service.slideType.pathologyType.courierDetails
                          .contactPersonName,
                      contactPersonPhone:
                        service.slideType.pathologyType.courierDetails
                          .contactPersonPhone,
                    }),

                    ...(service.slideType.pathologyType.courierDetails
                      .courierType === "PICK_UP_ASSISTANCE" && {
                      collectSpecimenFrom:
                        service.slideType.pathologyType.courierDetails
                          .collectSpecimenFrom,
                    }),
                  }),
                };

              default:
                return accualPreConsultationData;
            }
          },
          {} as Record<string, any>
        ),

        paymentReferenceId: preConsultation.paymentReference?.id,

        ...((preConsultation.preConsultationReviewStatus?.reviewer === "CMO" ||
          preConsultation.preConsultationReviewStatus?.reviewer === "HMT" ||
          preConsultation.preConsultationReviewStatus?.reviewer === "MO") && {
          reviewerId: preConsultation.preConsultationReviewStatus?.reviewerId,
          reviewStatus:
            preConsultation.preConsultationReviewStatus?.reviewStatus.status,
          reviewDate: preConsultation.preConsultationReviewStatus?.reviewDate,

          ...(preConsultation.preConsultationReviewStatus?.reviewStatus
            .status === "REJECTED" && {
            reviewComments:
              preConsultation.preConsultationReviewStatus.reviewStatus.comments,
          }),
        }),
      },
      aggregateChildrenCollections: [
        {
          aggregateChildCollectionName: preConsultationNotification,
          items: getNotificationDataToSave(preConsultation),
        },
        {
          aggregateChildCollectionName: preConsultationAssignment,
          items: getAssignmentDataToSave(preConsultation),
        },
        {
          aggregateChildCollectionName: preConsultationMedicalReport,
          items: getMedicalReportsDataToSave(preConsultation),
        },
        {
          aggregateChildCollectionName:
            preConsultationPatientGovtIdentification,
          items: getPatientGovtIdsDataToSave(preConsultation),
        },
        {
          aggregateChildCollectionName: preConsultationReminder,
          items: getRemindersDataToSave(preConsultation),
        },
      ],
    };
    const result = domainToDataMapper(preConsultation);
    expect(result).toEqual(expectedDataModel);
  });
});

describe("DataToDomainMapper", () => {
  it("should map DataModel to Pre Consultation", () => {
    const expectedPreConsultation: PreConsultation = {
      id: "123456",
      name: "PreConsultation",
      version: 1,
      versionComments: "versionComments",
      auditHistory: new Set([
        {
          createdBy: "testUserId",
          comments: "Create a new pre consultation",
          version: 1,
          commandName: "CreatePreConsultation",
          timestamp: expect.any(Date),
        },
      ]),
      isNew: false,
      inquiryId: "INQ001",
      IRN: "IRN001",
      services: [
        {
          name: "VIDEO_CONSULTATION",
          preferredPhysicianName: "Dr. Smith",
          supplimentaryServices: [
            {
              name: "INTEGRATIVE_MEDICINE",
            },
          ],
          isMultiMdConsult: false,
        },
        {
          name: "PATHOLOGY_REVIEW",
          slideType: {
            type: "STAINED_SLIDES",
            pathologyType: {
              type: "STANDARD_PATHOLOGY",
              courierDetails: {
                courierType: "SELF_COURIER",
                trackingId: "12345",
                contactPersonName: "John Doe",
                contactPersonPhone: "1234567890",
              },
            },
          },
        },
      ],
      paymentReference: {
        id: "PAY001",
      },
      preConsultationReviewStatus: {
        reviewer: "MO",
        reviewerId: "MO-001",
        reviewStatus: { status: "APPROVED" },
        reviewDate: expect.any(Date),
      },
      medicalReports: [
        {
          category: "LAB_REPORTS",
          reportType: "BIOPSY",
          description: "Biopsy report",
          takenDate: expect.any(Date),
          referenceDocument: {
            id: "REF001",
          },
        },
      ],
      patientGovtIdentifications: [
        {
          patientGovtIdentificationType: {
            type: "AADHAAR_CARD",
            aadhaarNumber: "123456789012",
          },
          referenceDocument: { id: "RI1234" },
        },
      ],
      assignments: {
        MO: {
          preConsultationAssignementId: "1234567890",
          assignedDate: expect.any(Date),
          assignedTo: "MO",
          assignedUserId: "USER001",
          assignmentMode: {
            assignedBy: "MANUAL",
            assignedByUserId: "USER002",
          },
        },
      },
      preConsultationReminders: {
        SERVICE_SELECTION_REMINDER_FOR_PATIENT: {
          reminderId: "REM001",
          createdDate: expect.any(Date),
          reminderStatus: {
            status: "CANCELLED",
            reminderCancelledDate: expect.any(Date),
          },
          reminderDate: expect.any(Date),
          reminderType: "SERVICE_SELECTION_REMINDER_FOR_PATIENT",
        },
      },
      preConsultationNotifications: {
        MO_ASSIGNMENT_TO_HMT_AND_CMO: {
          notificationId: "NOTIF-001",
          notifiedDate: expect.any(Date),
          notificationType: "MO_ASSIGNMENT_TO_HMT_AND_CMO",
        },
        PATIENT_GOVT_ID_REJECTED_TO_PMC: {
          notificationId: "NOTIF-002",
          notifiedDate: expect.any(Date),
          notificationType: "PATIENT_GOVT_ID_REJECTED_TO_PMC",
          notificationComment: "Govt ID rejected",
        },
      },
    };

    const result = dataToDomainMapper(dataModel);
    expect(result).toEqual(expectedPreConsultation);
  });
});
