import { ulid } from "ulid";
import {
  type DomainToDataMapper,
  type DataModel,
  type AggregateChildrenCollectionKeyFields,
  type Schema,
  type DataToDomainMapper,
} from "@icliniqSmartDoctor/reactive-framework";
import type {
  Automatic,
  Cancelled,
  Manual,
  MedicalReport,
  PatientGovtIdentification,
  Pending,
  PreConsultation,
  PreConsultationReviewStatus,
  Sent,
  Service,
  SupplimentaryService,
} from "../../core/domain/model/types/pre-consultation-aggregate.js";
import {
  preConsultationAssignment,
  preConsultationPreConsultation,
  preConsultationMedicalReport,
  preConsultationNotification,
  preConsultationPatientGovtIdentification,
  preConsultationReminder,
} from "./collections.js";

const aggregateName = "PreConsultation";

export const domainToDataMapperDirectus: DomainToDataMapper<PreConsultation> = (
  preConsultation: PreConsultation
): DataModel => {
  const preConsultationDomainToDataMapper: DataModel = {
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
        (actualPreConsultationData, service) => {
          switch (service.name) {
            case "VIDEO_CONSULTATION":
            case "WRITTEN_CONSULTATION":
              return {
                ...actualPreConsultationData,
                preferredPhysicianName: service.preferredPhysicianName,
                supplimentaryServices: service.supplimentaryServices?.map(
                  (supplimentaryService) => supplimentaryService.name
                ),
                isMultiMdConsult: service.isMultiMdConsult,
              };

            case "PATHOLOGY_REVIEW":
              return {
                ...actualPreConsultationData,
                slideType: service.slideType.type,

                ...(service.slideType.type !== "NONE" && {
                  pathologyType: service.slideType.pathologyType.type,
                  courierType:
                    service.slideType.pathologyType.courierDetails.courierType,

                  ...(service.slideType.pathologyType.courierDetails
                    .courierType === "SELF_COURIER" && {
                    trackingId:
                      service.slideType.pathologyType.courierDetails.trackingId,
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
              return actualPreConsultationData;
          }
        },
        {}
      ),

      paymentReferenceId: preConsultation.paymentReference?.id as string,

      ...((preConsultation.preConsultationReviewStatus?.reviewer === "CMO" ||
        preConsultation.preConsultationReviewStatus?.reviewer === "HMT" ||
        preConsultation.preConsultationReviewStatus?.reviewer === "MO") && {
        reviewerId: preConsultation.preConsultationReviewStatus?.reviewerId,
        reviewStatus:
          preConsultation.preConsultationReviewStatus?.reviewStatus.status,
        reviewDate: preConsultation.preConsultationReviewStatus?.reviewDate,

        ...(preConsultation.preConsultationReviewStatus?.reviewStatus.status ===
          "REJECTED" && {
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
        aggregateChildCollectionName: preConsultationPatientGovtIdentification,
        items: getPatientGovtIdsDataToSave(preConsultation),
      },
      {
        aggregateChildCollectionName: preConsultationReminder,
        items: getRemindersDataToSave(preConsultation),
      },
    ],
  };
  return preConsultationDomainToDataMapper;
};

export const getAssignmentDataToSave = (
  preConsultation: PreConsultation
): (AggregateChildrenCollectionKeyFields & Record<string, unknown>)[] => {
  const assignmentData: (AggregateChildrenCollectionKeyFields &
    Record<string, unknown>)[] = [];

  if (!preConsultation.assignments) {
    return [];
  }

  if (preConsultation.assignments.MO) {
    assignmentData.push({
      aggregateName: aggregateName,
      aggregateId: preConsultation.id,
      assignedTo: preConsultation.assignments.MO.assignedTo,
      assignedDate: preConsultation.assignments.MO.assignedDate
        ? new Date(preConsultation.assignments.MO.assignedDate).toISOString()
        : null,
      assignedUserId: preConsultation.assignments.MO.assignedUserId,
      assignmentMode: preConsultation.assignments.MO.assignmentMode.assignedBy,

      ...(preConsultation.assignments.MO.assignmentMode.assignedBy ===
        "MANUAL" && {
        assignedByUserId:
          preConsultation.assignments.MO.assignmentMode.assignedByUserId,
      }),

      id: preConsultation.assignments.MO.preConsultationAssignementId,
      IRN: preConsultation.IRN,
    });
  }

  return assignmentData;
};

export const getNotificationDataToSave = (
  preConsultation: PreConsultation
): (AggregateChildrenCollectionKeyFields & Record<string, unknown>)[] => {
  if (!preConsultation.preConsultationNotifications) {
    return [];
  }

  const notificationData: (AggregateChildrenCollectionKeyFields &
    Record<string, unknown>)[] = [];

  const createNotificationData = (
    notificationType: string,
    notificationId: string,
    notifiedDate: Date,
    notificationComment?: string
  ): AggregateChildrenCollectionKeyFields & Record<string, unknown> => {
    return {
      aggregateName: aggregateName,
      aggregateId: preConsultation.id,
      notificationId: notificationId,
      notifiedDate: notifiedDate ? new Date(notifiedDate).toISOString() : null,
      notificationType: notificationType,
      notificationComment: notificationComment,
      id: `#_${preConsultation.id}_${notificationType}`,
    };
  };

  if (
    preConsultation.preConsultationNotifications.MO_ASSIGNMENT_TO_HMT_AND_CMO
  ) {
    notificationData.push(
      createNotificationData(
        "MO_ASSIGNMENT_TO_HMT_AND_CMO",
        preConsultation.preConsultationNotifications
          .MO_ASSIGNMENT_TO_HMT_AND_CMO.notificationId,
        preConsultation.preConsultationNotifications
          .MO_ASSIGNMENT_TO_HMT_AND_CMO.notifiedDate
      )
    );
  }

  if (preConsultation.preConsultationNotifications.INQUIRY_APPROVAL_TO_CLIENT) {
    notificationData.push(
      createNotificationData(
        "INQUIRY_APPROVAL_TO_CLIENT",
        preConsultation.preConsultationNotifications.INQUIRY_APPROVAL_TO_CLIENT
          .notificationId,
        preConsultation.preConsultationNotifications.INQUIRY_APPROVAL_TO_CLIENT
          .notifiedDate
      )
    );
  }

  if (
    preConsultation.preConsultationNotifications.PRICING_BROCHURE_TO_PATIENT
  ) {
    notificationData.push(
      createNotificationData(
        "PRICING_BROCHURE_TO_PATIENT",
        preConsultation.preConsultationNotifications.PRICING_BROCHURE_TO_PATIENT
          .notificationId,
        preConsultation.preConsultationNotifications.PRICING_BROCHURE_TO_PATIENT
          .notifiedDate
      )
    );
  }

  if (
    preConsultation.preConsultationNotifications.PHYSICIAN_PREFERENCE_TO_PMC
  ) {
    notificationData.push(
      createNotificationData(
        "PHYSICIAN_PREFERENCE_TO_PMC",
        preConsultation.preConsultationNotifications.PHYSICIAN_PREFERENCE_TO_PMC
          .notificationId,
        preConsultation.preConsultationNotifications.PHYSICIAN_PREFERENCE_TO_PMC
          .notifiedDate
      )
    );
  }

  if (preConsultation.preConsultationNotifications.UPLOADED_REPORTS_TO_PMC) {
    notificationData.push(
      createNotificationData(
        "UPLOADED_REPORTS_TO_PMC",
        preConsultation.preConsultationNotifications.UPLOADED_REPORTS_TO_PMC
          .notificationId,
        preConsultation.preConsultationNotifications.UPLOADED_REPORTS_TO_PMC
          .notifiedDate
      )
    );
  }

  if (
    preConsultation.preConsultationNotifications.UPLOADED_PATIENT_GOVT_ID_TO_PMC
  ) {
    notificationData.push(
      createNotificationData(
        "UPLOADED_PATIENT_GOVT_ID_TO_PMC",
        preConsultation.preConsultationNotifications
          .UPLOADED_PATIENT_GOVT_ID_TO_PMC.notificationId,
        preConsultation.preConsultationNotifications
          .UPLOADED_PATIENT_GOVT_ID_TO_PMC.notifiedDate
      )
    );
  }

  if (
    preConsultation.preConsultationNotifications.PATIENT_GOVT_ID_VERIFIED_TO_PMC
  ) {
    notificationData.push(
      createNotificationData(
        "PATIENT_GOVT_ID_VERIFIED_TO_PMC",
        preConsultation.preConsultationNotifications
          .PATIENT_GOVT_ID_VERIFIED_TO_PMC.notificationId,
        preConsultation.preConsultationNotifications
          .PATIENT_GOVT_ID_VERIFIED_TO_PMC.notifiedDate
      )
    );
  }

  if (
    preConsultation.preConsultationNotifications
      .PATIENT_GOVT_ID_VERIFIED_TO_PATIENT
  ) {
    notificationData.push(
      createNotificationData(
        "PATIENT_GOVT_ID_VERIFIED_TO_PATIENT",
        preConsultation.preConsultationNotifications
          .PATIENT_GOVT_ID_VERIFIED_TO_PATIENT.notificationId,
        preConsultation.preConsultationNotifications
          .PATIENT_GOVT_ID_VERIFIED_TO_PATIENT.notifiedDate
      )
    );
  }

  if (
    preConsultation.preConsultationNotifications
      .INQUIRY_APPROVED_BY_MO_TO_PATIENT
  ) {
    notificationData.push(
      createNotificationData(
        "INQUIRY_APPROVED_BY_MO_TO_PATIENT",
        preConsultation.preConsultationNotifications
          .INQUIRY_APPROVED_BY_MO_TO_PATIENT.notificationId,
        preConsultation.preConsultationNotifications
          .INQUIRY_APPROVED_BY_MO_TO_PATIENT.notifiedDate
      )
    );
  }

  if (
    preConsultation.preConsultationNotifications
      .INQUIRY_APPROVED_BY_MO_TO_CLIENT
  ) {
    notificationData.push(
      createNotificationData(
        "INQUIRY_APPROVED_BY_MO_TO_CLIENT",
        preConsultation.preConsultationNotifications
          .INQUIRY_APPROVED_BY_MO_TO_CLIENT.notificationId,
        preConsultation.preConsultationNotifications
          .INQUIRY_APPROVED_BY_MO_TO_CLIENT.notifiedDate
      )
    );
  }

  if (preConsultation.preConsultationNotifications.PRO_BONO_PAYMENT_TO_CLIENT) {
    notificationData.push(
      createNotificationData(
        "PRO_BONO_PAYMENT_TO_CLIENT",
        preConsultation.preConsultationNotifications.PRO_BONO_PAYMENT_TO_CLIENT
          .notificationId,
        preConsultation.preConsultationNotifications.PRO_BONO_PAYMENT_TO_CLIENT
          .notifiedDate
      )
    );
  }

  if (
    preConsultation.preConsultationNotifications
      .PRO_BONO_PAYMENT_APPROVED_TO_PATIENT
  ) {
    notificationData.push(
      createNotificationData(
        "PRO_BONO_PAYMENT_APPROVED_TO_PATIENT",
        preConsultation.preConsultationNotifications
          .PRO_BONO_PAYMENT_APPROVED_TO_PATIENT.notificationId,
        preConsultation.preConsultationNotifications
          .PRO_BONO_PAYMENT_APPROVED_TO_PATIENT.notifiedDate
      )
    );
  }

  if (
    preConsultation.preConsultationNotifications
      .PRO_BONO_PAYMENT_APPROVED_TO_CLIENT
  ) {
    notificationData.push(
      createNotificationData(
        "PRO_BONO_PAYMENT_APPROVED_TO_CLIENT",
        preConsultation.preConsultationNotifications
          .PRO_BONO_PAYMENT_APPROVED_TO_CLIENT.notificationId,
        preConsultation.preConsultationNotifications
          .PRO_BONO_PAYMENT_APPROVED_TO_CLIENT.notifiedDate
      )
    );
  }

  if (
    preConsultation.preConsultationNotifications
      .PRO_BONO_PAYMENT_APPROVED_TO_IRT
  ) {
    notificationData.push(
      createNotificationData(
        "PRO_BONO_PAYMENT_APPROVED_TO_IRT",
        preConsultation.preConsultationNotifications
          .PRO_BONO_PAYMENT_APPROVED_TO_IRT.notificationId,
        preConsultation.preConsultationNotifications
          .PRO_BONO_PAYMENT_APPROVED_TO_IRT.notifiedDate
      )
    );
  }

  if (
    preConsultation.preConsultationNotifications.WIRE_TRANSFER_PAYMENT_TO_CLIENT
  ) {
    notificationData.push(
      createNotificationData(
        "WIRE_TRANSFER_PAYMENT_TO_CLIENT",
        preConsultation.preConsultationNotifications
          .WIRE_TRANSFER_PAYMENT_TO_CLIENT.notificationId,
        preConsultation.preConsultationNotifications
          .WIRE_TRANSFER_PAYMENT_TO_CLIENT.notifiedDate
      )
    );
  }

  if (
    preConsultation.preConsultationNotifications
      .WIRE_TRANSFER_PAYMENT_TO_NEWYORK_TEAM
  ) {
    notificationData.push(
      createNotificationData(
        "WIRE_TRANSFER_PAYMENT_TO_NEWYORK_TEAM",
        preConsultation.preConsultationNotifications
          .WIRE_TRANSFER_PAYMENT_TO_NEWYORK_TEAM.notificationId,
        preConsultation.preConsultationNotifications
          .WIRE_TRANSFER_PAYMENT_TO_NEWYORK_TEAM.notifiedDate
      )
    );
  }

  if (
    preConsultation.preConsultationNotifications
      .WIRE_TRANSFER_PAYMENT_APPROVED_TO_PATIENT
  ) {
    notificationData.push(
      createNotificationData(
        "WIRE_TRANSFER_PAYMENT_APPROVED_TO_PATIENT",
        preConsultation.preConsultationNotifications
          .WIRE_TRANSFER_PAYMENT_APPROVED_TO_PATIENT.notificationId,
        preConsultation.preConsultationNotifications
          .WIRE_TRANSFER_PAYMENT_APPROVED_TO_PATIENT.notifiedDate
      )
    );
  }

  if (
    preConsultation.preConsultationNotifications
      .WIRE_TRANSFER_PAYMENT_APPROVED_TO_CLIENT
  ) {
    notificationData.push(
      createNotificationData(
        "WIRE_TRANSFER_PAYMENT_APPROVED_TO_CLIENT",
        preConsultation.preConsultationNotifications
          .WIRE_TRANSFER_PAYMENT_APPROVED_TO_CLIENT.notificationId,
        preConsultation.preConsultationNotifications
          .WIRE_TRANSFER_PAYMENT_APPROVED_TO_CLIENT.notifiedDate
      )
    );
  }

  if (
    preConsultation.preConsultationNotifications
      .WIRE_TRANSFER_PAYMENT_APPROVED_TO_IRT
  ) {
    notificationData.push(
      createNotificationData(
        "WIRE_TRANSFER_PAYMENT_APPROVED_TO_IRT",
        preConsultation.preConsultationNotifications
          .WIRE_TRANSFER_PAYMENT_APPROVED_TO_IRT.notificationId,
        preConsultation.preConsultationNotifications
          .WIRE_TRANSFER_PAYMENT_APPROVED_TO_IRT.notifiedDate
      )
    );
  }

  if (
    preConsultation.preConsultationNotifications
      .PAYMENT_GATEWAY_APPROVED_TO_PATIENT
  ) {
    notificationData.push(
      createNotificationData(
        "PAYMENT_GATEWAY_APPROVED_TO_PATIENT",
        preConsultation.preConsultationNotifications
          .PAYMENT_GATEWAY_APPROVED_TO_PATIENT.notificationId,
        preConsultation.preConsultationNotifications
          .PAYMENT_GATEWAY_APPROVED_TO_PATIENT.notifiedDate
      )
    );
  }

  if (
    preConsultation.preConsultationNotifications
      .PAYMENT_GATEWAY_APPROVED_TO_CLIENT
  ) {
    notificationData.push(
      createNotificationData(
        "PAYMENT_GATEWAY_APPROVED_TO_CLIENT",
        preConsultation.preConsultationNotifications
          .PAYMENT_GATEWAY_APPROVED_TO_CLIENT.notificationId,
        preConsultation.preConsultationNotifications
          .PAYMENT_GATEWAY_APPROVED_TO_CLIENT.notifiedDate
      )
    );
  }

  if (
    preConsultation.preConsultationNotifications.PAMENT_GATEWAY_APPROVED_TO_IRT
  ) {
    notificationData.push(
      createNotificationData(
        "PAMENT_GATEWAY_APPROVED_TO_IRT",
        preConsultation.preConsultationNotifications
          .PAMENT_GATEWAY_APPROVED_TO_IRT.notificationId,
        preConsultation.preConsultationNotifications
          .PAMENT_GATEWAY_APPROVED_TO_IRT.notifiedDate
      )
    );
  }

  if (
    preConsultation.preConsultationNotifications.PATIENT_GOVT_ID_REJECTED_TO_PMC
  ) {
    notificationData.push(
      createNotificationData(
        "PATIENT_GOVT_ID_REJECTED_TO_PMC",
        preConsultation.preConsultationNotifications
          .PATIENT_GOVT_ID_REJECTED_TO_PMC.notificationId,
        preConsultation.preConsultationNotifications
          .PATIENT_GOVT_ID_REJECTED_TO_PMC.notifiedDate,
        preConsultation.preConsultationNotifications
          .PATIENT_GOVT_ID_REJECTED_TO_PMC.notificationComment
      )
    );
  }

  if (
    preConsultation.preConsultationNotifications
      .PATIENT_GOVT_ID_REJECTED_TO_PATIENT
  ) {
    notificationData.push(
      createNotificationData(
        "PATIENT_GOVT_ID_REJECTED_TO_PATIENT",
        preConsultation.preConsultationNotifications
          .PATIENT_GOVT_ID_REJECTED_TO_PATIENT.notificationId,
        preConsultation.preConsultationNotifications
          .PATIENT_GOVT_ID_REJECTED_TO_PATIENT.notifiedDate,
        preConsultation.preConsultationNotifications
          .PATIENT_GOVT_ID_REJECTED_TO_PATIENT.notificationComment
      )
    );
  }

  if (
    preConsultation.preConsultationNotifications
      .INQUIRY_REJECTED_BY_MO_TO_PATIENT
  ) {
    notificationData.push(
      createNotificationData(
        "INQUIRY_REJECTED_BY_MO_TO_PATIENT",
        preConsultation.preConsultationNotifications
          .INQUIRY_REJECTED_BY_MO_TO_PATIENT.notificationId,
        preConsultation.preConsultationNotifications
          .INQUIRY_REJECTED_BY_MO_TO_PATIENT.notifiedDate,
        preConsultation.preConsultationNotifications
          .INQUIRY_REJECTED_BY_MO_TO_PATIENT.notificationComment
      )
    );
  }

  if (
    preConsultation.preConsultationNotifications
      .INQUIRY_REJECTED_BY_MO_TO_CLIENT
  ) {
    notificationData.push(
      createNotificationData(
        "INQUIRY_REJECTED_BY_MO_TO_CLIENT",
        preConsultation.preConsultationNotifications
          .INQUIRY_REJECTED_BY_MO_TO_CLIENT.notificationId,
        preConsultation.preConsultationNotifications
          .INQUIRY_REJECTED_BY_MO_TO_CLIENT.notifiedDate,
        preConsultation.preConsultationNotifications
          .INQUIRY_REJECTED_BY_MO_TO_CLIENT.notificationComment
      )
    );
  }

  if (
    preConsultation.preConsultationNotifications
      .PRO_BONO_PAYMENT_REJECTED_TO_PATIENT
  ) {
    notificationData.push(
      createNotificationData(
        "PRO_BONO_PAYMENT_REJECTED_TO_PATIENT",
        preConsultation.preConsultationNotifications
          .PRO_BONO_PAYMENT_REJECTED_TO_PATIENT.notificationId,
        preConsultation.preConsultationNotifications
          .PRO_BONO_PAYMENT_REJECTED_TO_PATIENT.notifiedDate,
        preConsultation.preConsultationNotifications
          .PRO_BONO_PAYMENT_REJECTED_TO_PATIENT.notificationComment
      )
    );
  }

  if (
    preConsultation.preConsultationNotifications
      .PRO_BONO_PAYMENT_REJECTED_TO_CLIENT
  ) {
    notificationData.push(
      createNotificationData(
        "PRO_BONO_PAYMENT_REJECTED_TO_CLIENT",
        preConsultation.preConsultationNotifications
          .PRO_BONO_PAYMENT_REJECTED_TO_CLIENT.notificationId,
        preConsultation.preConsultationNotifications
          .PRO_BONO_PAYMENT_REJECTED_TO_CLIENT.notifiedDate,
        preConsultation.preConsultationNotifications
          .PRO_BONO_PAYMENT_REJECTED_TO_CLIENT.notificationComment
      )
    );
  }

  if (
    preConsultation.preConsultationNotifications
      .WIRE_TRANSFER_PAYMENT_REJECTED_TO_PATIENT
  ) {
    notificationData.push(
      createNotificationData(
        "WIRE_TRANSFER_PAYMENT_REJECTED_TO_PATIENT",
        preConsultation.preConsultationNotifications
          .WIRE_TRANSFER_PAYMENT_REJECTED_TO_PATIENT.notificationId,
        preConsultation.preConsultationNotifications
          .WIRE_TRANSFER_PAYMENT_REJECTED_TO_PATIENT.notifiedDate,
        preConsultation.preConsultationNotifications
          .WIRE_TRANSFER_PAYMENT_REJECTED_TO_PATIENT.notificationComment
      )
    );
  }

  if (
    preConsultation.preConsultationNotifications
      .WIRE_TRANSFER_PAYMENT_REJECTED_TO_CLIENT
  ) {
    notificationData.push(
      createNotificationData(
        "WIRE_TRANSFER_PAYMENT_REJECTED_TO_CLIENT",
        preConsultation.preConsultationNotifications
          .WIRE_TRANSFER_PAYMENT_REJECTED_TO_CLIENT.notificationId,
        preConsultation.preConsultationNotifications
          .WIRE_TRANSFER_PAYMENT_REJECTED_TO_CLIENT.notifiedDate,
        preConsultation.preConsultationNotifications
          .WIRE_TRANSFER_PAYMENT_REJECTED_TO_CLIENT.notificationComment
      )
    );
  }

  if (
    preConsultation.preConsultationNotifications
      .PAYMENT_GATEWAY_REJECTED_TO_PATIENT
  ) {
    notificationData.push(
      createNotificationData(
        "PAYMENT_GATEWAY_REJECTED_TO_PATIENT",
        preConsultation.preConsultationNotifications
          .PAYMENT_GATEWAY_REJECTED_TO_PATIENT.notificationId,
        preConsultation.preConsultationNotifications
          .PAYMENT_GATEWAY_REJECTED_TO_PATIENT.notifiedDate,
        preConsultation.preConsultationNotifications
          .PAYMENT_GATEWAY_REJECTED_TO_PATIENT.notificationComment
      )
    );
  }

  if (
    preConsultation.preConsultationNotifications
      .PAYMENT_GATEWAY_REJECTED_TO_CLIENT
  ) {
    notificationData.push(
      createNotificationData(
        "PAYMENT_GATEWAY_REJECTED_TO_CLIENT",
        preConsultation.preConsultationNotifications
          .PAYMENT_GATEWAY_REJECTED_TO_CLIENT.notificationId,
        preConsultation.preConsultationNotifications
          .PAYMENT_GATEWAY_REJECTED_TO_CLIENT.notifiedDate,
        preConsultation.preConsultationNotifications
          .PAYMENT_GATEWAY_REJECTED_TO_CLIENT.notificationComment
      )
    );
  }

  return notificationData;
};

export const getMedicalReportsDataToSave = (
  preConsultation: PreConsultation
): (AggregateChildrenCollectionKeyFields & Record<string, unknown>)[] => {
  const medicalReportsData: (AggregateChildrenCollectionKeyFields &
    Record<string, unknown>)[] = [];

  if (!preConsultation.medicalReports) {
    return [];
  }

  preConsultation.medicalReports.forEach((report) => {
    medicalReportsData.push({
      aggregateName: aggregateName,
      aggregateId: preConsultation.id,
      reportCategory: report.category,
      reportType: report.reportType,
      reportDescription: report.description,
      reportTakenDate: report.takenDate
        ? new Date(report.takenDate).toISOString()
        : null,
      referenceDocumentId: report.referenceDocument?.id,
      reportStatus: "PENDING",
      id: ulid(),
      IRN: preConsultation.IRN,
    });
  });

  return medicalReportsData;
};

export const getPatientGovtIdsDataToSave = (
  preConsultation: PreConsultation
): (AggregateChildrenCollectionKeyFields & Record<string, unknown>)[] => {
  const patientGovtIdsData: (AggregateChildrenCollectionKeyFields &
    Record<string, unknown>)[] = [];

  if (!preConsultation.patientGovtIdentifications) {
    return [];
  }

  preConsultation.patientGovtIdentifications.forEach((identification) => {
    patientGovtIdsData.push({
      aggregateName: aggregateName,
      aggregateId: preConsultation.id,
      identificationType: identification.patientGovtIdentificationType.type,

      ...(identification.patientGovtIdentificationType?.type === "OTHER" && {
        identificationNumber:
          identification.patientGovtIdentificationType
            .otherGovtIdentificationNumber,
        otherIdentificationName:
          identification.patientGovtIdentificationType
            .otherGovtIdentificationName,
      }),

      ...(identification.patientGovtIdentificationType?.type ===
        "AADHAAR_CARD" && {
        identificationNumber:
          identification.patientGovtIdentificationType.aadhaarNumber,
      }),

      ...(identification.patientGovtIdentificationType?.type === "PASSPORT" && {
        identificationNumber:
          identification.patientGovtIdentificationType.passportNumber,
      }),

      ...(identification.patientGovtIdentificationType?.type ===
        "DRIVING_LICENSE" && {
        identificationNumber:
          identification.patientGovtIdentificationType.drivingLicenseNumber,
      }),

      identificationStatus: "PENDING",
      id: ulid(),
      IRN: preConsultation.IRN,
      referenceDocumentId: identification.referenceDocument?.id,
    });
  });

  return patientGovtIdsData;
};

export const getRemindersDataToSave = (
  preConsultation: PreConsultation
): (AggregateChildrenCollectionKeyFields & Record<string, unknown>)[] => {
  if (!preConsultation.preConsultationReminders) {
    return [];
  }

  const remindersData: (AggregateChildrenCollectionKeyFields &
    Record<string, unknown>)[] = [];

  const createRemindersData = (
    reminderType: string,
    reminderId: string,
    reminderStatus: Pending | Sent | Cancelled,
    reminderDate: Date,
    createdDate: Date
  ): AggregateChildrenCollectionKeyFields & Record<string, unknown> => {
    return {
      aggregateName: aggregateName,
      aggregateId: preConsultation.id,
      reminderId: reminderId,
      createdDate: createdDate ? new Date(reminderDate).toISOString() : null,
      reminderStatus: reminderStatus.status,
      reminderDate: reminderDate ? new Date(reminderDate).toISOString() : null,
      reminderType: reminderType,

      ...(reminderStatus.status === "CANCELLED" && {
        reminderCancelledDate: reminderStatus.reminderCancelledDate
          ? new Date(reminderStatus.reminderCancelledDate).toISOString()
          : null,
      }),
      id: `#_${preConsultation.id}_${reminderType}`,
      IRN: preConsultation.IRN,
    };
  };

  if (
    preConsultation.preConsultationReminders
      .SERVICE_SELECTION_REMINDER_FOR_PATIENT
  ) {
    remindersData.push(
      createRemindersData(
        "SERVICE_SELECTION_REMINDER_FOR_PATIENT",
        preConsultation.preConsultationReminders
          .SERVICE_SELECTION_REMINDER_FOR_PATIENT.reminderId,
        preConsultation.preConsultationReminders
          .SERVICE_SELECTION_REMINDER_FOR_PATIENT.reminderStatus,
        preConsultation.preConsultationReminders
          .SERVICE_SELECTION_REMINDER_FOR_PATIENT.reminderDate,
        preConsultation.preConsultationReminders
          .SERVICE_SELECTION_REMINDER_FOR_PATIENT.createdDate
      )
    );
  }

  if (
    preConsultation.preConsultationReminders
      .SERVICE_SELECTION_REMINDER_FOR_CLIENT
  ) {
    remindersData.push(
      createRemindersData(
        "SERVICE_SELECTION_REMINDER_FOR_CLIENT",
        preConsultation.preConsultationReminders
          .SERVICE_SELECTION_REMINDER_FOR_CLIENT.reminderId,
        preConsultation.preConsultationReminders
          .SERVICE_SELECTION_REMINDER_FOR_CLIENT.reminderStatus,
        preConsultation.preConsultationReminders
          .SERVICE_SELECTION_REMINDER_FOR_CLIENT.reminderDate,
        preConsultation.preConsultationReminders
          .SERVICE_SELECTION_REMINDER_FOR_CLIENT.createdDate
      )
    );
  }

  if (
    preConsultation.preConsultationReminders
      .COURIER_SAMPLE_SLIDES_REMINDER_FOR_PATIENT
  ) {
    remindersData.push(
      createRemindersData(
        "COURIER_SAMPLE_SLIDES_REMINDER_FOR_PATIENT",
        preConsultation.preConsultationReminders
          .COURIER_SAMPLE_SLIDES_REMINDER_FOR_PATIENT.reminderId,
        preConsultation.preConsultationReminders
          .COURIER_SAMPLE_SLIDES_REMINDER_FOR_PATIENT.reminderStatus,
        preConsultation.preConsultationReminders
          .COURIER_SAMPLE_SLIDES_REMINDER_FOR_PATIENT.reminderDate,
        preConsultation.preConsultationReminders
          .COURIER_SAMPLE_SLIDES_REMINDER_FOR_PATIENT.createdDate
      )
    );
  }

  if (
    preConsultation.preConsultationReminders
      .COURIER_SAMPLE_SLIDES_REMINDER_FOR_CLIENT
  ) {
    remindersData.push(
      createRemindersData(
        "COURIER_SAMPLE_SLIDES_REMINDER_FOR_CLIENT",
        preConsultation.preConsultationReminders
          .COURIER_SAMPLE_SLIDES_REMINDER_FOR_CLIENT.reminderId,
        preConsultation.preConsultationReminders
          .COURIER_SAMPLE_SLIDES_REMINDER_FOR_CLIENT.reminderStatus,
        preConsultation.preConsultationReminders
          .COURIER_SAMPLE_SLIDES_REMINDER_FOR_CLIENT.reminderDate,
        preConsultation.preConsultationReminders
          .COURIER_SAMPLE_SLIDES_REMINDER_FOR_CLIENT.createdDate
      )
    );
  }

  if (
    preConsultation.preConsultationReminders
      .MEDICAL_REPORTS_REMINDER_FOR_PATIENT
  ) {
    remindersData.push(
      createRemindersData(
        "MEDICAL_REPORTS_REMINDER_FOR_PATIENT",
        preConsultation.preConsultationReminders
          .MEDICAL_REPORTS_REMINDER_FOR_PATIENT.reminderId,
        preConsultation.preConsultationReminders
          .MEDICAL_REPORTS_REMINDER_FOR_PATIENT.reminderStatus,
        preConsultation.preConsultationReminders
          .MEDICAL_REPORTS_REMINDER_FOR_PATIENT.reminderDate,
        preConsultation.preConsultationReminders
          .MEDICAL_REPORTS_REMINDER_FOR_PATIENT.createdDate
      )
    );
  }

  if (
    preConsultation.preConsultationReminders.MEDICAL_REPORTS_REMINDER_FOR_CLIENT
  ) {
    remindersData.push(
      createRemindersData(
        "MEDICAL_REPORTS_REMINDER_FOR_CLIENT",
        preConsultation.preConsultationReminders
          .MEDICAL_REPORTS_REMINDER_FOR_CLIENT.reminderId,
        preConsultation.preConsultationReminders
          .MEDICAL_REPORTS_REMINDER_FOR_CLIENT.reminderStatus,
        preConsultation.preConsultationReminders
          .MEDICAL_REPORTS_REMINDER_FOR_CLIENT.reminderDate,
        preConsultation.preConsultationReminders
          .MEDICAL_REPORTS_REMINDER_FOR_CLIENT.createdDate
      )
    );
  }

  if (
    preConsultation.preConsultationReminders
      .GOVT_IDENTIFICATION_REMINDER_FOR_PATIENT
  ) {
    remindersData.push(
      createRemindersData(
        "GOVT_IDENTIFICATION_REMINDER_FOR_PATIENT",
        preConsultation.preConsultationReminders
          .GOVT_IDENTIFICATION_REMINDER_FOR_PATIENT.reminderId,
        preConsultation.preConsultationReminders
          .GOVT_IDENTIFICATION_REMINDER_FOR_PATIENT.reminderStatus,
        preConsultation.preConsultationReminders
          .GOVT_IDENTIFICATION_REMINDER_FOR_PATIENT.reminderDate,
        preConsultation.preConsultationReminders
          .GOVT_IDENTIFICATION_REMINDER_FOR_PATIENT.createdDate
      )
    );
  }

  if (
    preConsultation.preConsultationReminders
      .GOVT_IDENTIFICATION_REMINDER_FOR_CLIENT
  ) {
    remindersData.push(
      createRemindersData(
        "GOVT_IDENTIFICATION_REMINDER_FOR_CLIENT",
        preConsultation.preConsultationReminders
          .GOVT_IDENTIFICATION_REMINDER_FOR_CLIENT.reminderId,
        preConsultation.preConsultationReminders
          .GOVT_IDENTIFICATION_REMINDER_FOR_CLIENT.reminderStatus,
        preConsultation.preConsultationReminders
          .GOVT_IDENTIFICATION_REMINDER_FOR_CLIENT.reminderDate,
        preConsultation.preConsultationReminders
          .GOVT_IDENTIFICATION_REMINDER_FOR_CLIENT.createdDate
      )
    );
  }

  return remindersData;
};

export type Assignment = {
  assignedTo: "MO";
  assignedUserId: string;
  assignedDate: Date;
  assignmentMode: string;
  assignedByUserId?: string;
};

export type Notification = {
  notificationId: string;
  notifiedDate: Date;
  notificationType: string;
  notificationComment?: string;
};

export type Reminder = {
  reminderId: string;
  createdDate: Date;
  reminderStatus: string;
  reminderCancelledDate?: Date;
  reminderDate: Date;
  reminderType: string;
};

export const dataToDomainMapperDirectus: DataToDomainMapper<PreConsultation> = (
  dataModel: DataModel
): PreConsultation => {
  const auditHistory = dataModel.aggregateRootValues.auditHistory.history;

  const inquiryNotificationData = dataModel.aggregateChildrenCollections.find(
    (childrenCollection) =>
      childrenCollection.aggregateChildCollectionName ===
      preConsultationNotification
  );

  const getNotificationByType = (
    notificationType: string
  ): (AggregateChildrenCollectionKeyFields & Notification) | undefined => {
    return inquiryNotificationData?.items.find((item) => {
      const notification = item as AggregateChildrenCollectionKeyFields &
        Notification;
      return notification.notificationType === notificationType;
    }) as AggregateChildrenCollectionKeyFields & Notification;
  };

  const assignementData = dataModel.aggregateChildrenCollections.find(
    (childCollection) => {
      return (
        childCollection.aggregateChildCollectionName ===
        preConsultationAssignment
      );
    }
  );
  const getAssignmentByType = (
    assignmentType: string
  ): (AggregateChildrenCollectionKeyFields & Assignment) | undefined => {
    return assignementData?.items.find((item) => {
      const assignement = item as AggregateChildrenCollectionKeyFields &
        Assignment;
      return assignement.assignedTo === assignmentType;
    }) as AggregateChildrenCollectionKeyFields & Assignment;
  };

  const remindersData = dataModel.aggregateChildrenCollections.find(
    (childCollection) => {
      return (
        childCollection.aggregateChildCollectionName === preConsultationReminder
      );
    }
  );

  const getReminderByType = (
    reminderType: string
  ): (AggregateChildrenCollectionKeyFields & Reminder) | undefined => {
    return remindersData?.items.find((item) => {
      const reminder = item as AggregateChildrenCollectionKeyFields & Reminder;
      return reminder.reminderType === reminderType;
    }) as AggregateChildrenCollectionKeyFields & Reminder;
  };

  const patientGovtIdentificationsData =
    dataModel.aggregateChildrenCollections.find(
      (childCollection) =>
        childCollection.aggregateChildCollectionName ===
        preConsultationPatientGovtIdentification
    );

  const patientGovtIdentifications: PatientGovtIdentification[] = (
    patientGovtIdentificationsData?.items || []
  )
    .map((item) => {
      const identificationType = item["identificationType"];
      switch (identificationType) {
        case "AADHAAR_CARD":
          return {
            patientGovtIdentificationType: {
              type: "AADHAAR_CARD",
              aadhaarNumber: item["identificationNumber"] as string,
            },
            referenceDocument: {
              id: item["referenceDocumentId"] as string,
            },
          } as PatientGovtIdentification;
        case "PASSPORT":
          return {
            patientGovtIdentificationType: {
              type: "PASSPORT",
              passportNumber: item["identificationNumber"] as string,
            },
            referenceDocument: {
              id: item["referenceDocumentId"] as string,
            },
          } as PatientGovtIdentification;
        case "DRIVING_LICENSE":
          return {
            patientGovtIdentificationType: {
              type: "DRIVING_LICENSE",
              drivingLicenseNumber: item["identificationNumber"] as string,
            },
            referenceDocument: {
              id: item["referenceDocumentId"] as string,
            },
          } as PatientGovtIdentification;
        case "OTHER":
          return {
            patientGovtIdentificationType: {
              type: "OTHER",
              otherGovtIdentificationName: item[
                "otherIdentificationName"
              ] as string,
              otherGovtIdentificationNumber: item[
                "identificationNumber"
              ] as string,
            },
            referenceDocument: {
              id: item["referenceDocumentId"] as string,
            },
          } as PatientGovtIdentification;
        default:
          return undefined;
      }
    })
    .filter((item): item is PatientGovtIdentification => item !== undefined);

  const medicalReportsData = dataModel.aggregateChildrenCollections.find(
    (childCollection) => {
      return (
        childCollection.aggregateChildCollectionName ===
        preConsultationMedicalReport
      );
    }
  );

  const services = (dataModel.aggregateRootValues["services"] as string[]).map(
    (serviceName: string) => {
      const convertSupplimentaryService = (
        name: string
      ): SupplimentaryService | null => {
        switch (name) {
          case "INTEGRATIVE_MEDICINE": {
            return { name: "INTEGRATIVE_MEDICINE" };
          }
          case "ONCOLOGY_PAIN_MANAGEMENT": {
            return { name: "ONCOLOGY_PAIN_MANAGEMENT" };
          }
          default: {
            return null;
          }
        }
      };

      switch (serviceName) {
        case "VIDEO_CONSULTATION":
        case "WRITTEN_CONSULTATION":
          return {
            name: serviceName,
            preferredPhysicianName:
              dataModel.aggregateRootValues["preferredPhysicianName"],
            isMultiMdConsult: dataModel.aggregateRootValues["isMultiMdConsult"],
            supplimentaryServices: Array.isArray(
              dataModel.aggregateRootValues["supplimentaryServices"]
            )
              ? (
                  dataModel.aggregateRootValues[
                    "supplimentaryServices"
                  ] as string[]
                )
                  .map((supplimentaryService) =>
                    convertSupplimentaryService(supplimentaryService)
                  )
                  .filter((name): name is SupplimentaryService => name !== null)
              : undefined,
          } as Service;
        case "PATHOLOGY_REVIEW":
          return {
            name: serviceName,
            slideType: {
              type: dataModel.aggregateRootValues["slideType"],
              pathologyType: {
                type: dataModel.aggregateRootValues["pathologyType"],
                courierDetails: {
                  courierType: dataModel.aggregateRootValues["courierType"],

                  ...(dataModel.aggregateRootValues["courierType"] ===
                    "SELF_COURIER" && {
                    trackingId: dataModel.aggregateRootValues["trackingId"],
                    contactPersonName:
                      dataModel.aggregateRootValues["contactPersonName"],
                    contactPersonPhone:
                      dataModel.aggregateRootValues["contactPersonPhone"],
                  }),

                  ...(dataModel.aggregateRootValues["courierType"] ===
                    "PICK_UP_ASSISTANCE" && {
                    collectSpecimenFrom:
                      dataModel.aggregateRootValues["collectSpecimenFrom"],
                  }),
                },
              },
            },
          } as Service;
        case "RADIOLOGY_REVIEW":
          return { name: serviceName } as Service;
        case "TRAVEL_TO_MSK_NEW_YORK":
          return { name: serviceName } as Service;
        default:
          return null;
      }
    }
  );

  const preConsultationDataToDomainMapper: PreConsultation = {
    id: dataModel.aggregateRootValues.id,
    name: aggregateName,
    version: dataModel.aggregateRootValues.version,
    versionComments: dataModel.aggregateRootValues["comments"] as string,
    auditHistory: new Set(auditHistory),
    isNew: false,
    inquiryId: dataModel.aggregateRootValues["inquiryId"] as string,
    IRN: dataModel.aggregateRootValues["IRN"] as string,
    paymentReference: {
      id: dataModel.aggregateRootValues["paymentReferenceId"] as string,
    },
    services: services as Service[],
    medicalReports: medicalReportsData?.items.map((item) => {
      return {
        category: item["reportCategory"],
        reportType: item["reportType"],
        description: item["reportDescription"],
        takenDate: item["reportTakenDate"],
        referenceDocument: { id: item["referenceDocumentId"] },
      };
    }) as MedicalReport[],
    patientGovtIdentifications: patientGovtIdentifications,
    assignments: {
      MO: {
        assignedDate: getAssignmentByType("MO")?.assignedDate as Date,
        assignedTo: getAssignmentByType("MO")?.assignedTo as "MO",
        assignedUserId: getAssignmentByType("MO")?.assignedUserId as string,
        assignmentMode: {
          assignedBy: getAssignmentByType("MO")?.assignmentMode as string,

          ...(getAssignmentByType("MO")?.assignmentMode === "MANUAL" && {
            assignedByUserId: getAssignmentByType("MO")?.assignedByUserId,
          }),
        } as Automatic | Manual,
        preConsultationAssignementId: getAssignmentByType("MO")?.id as string,
      },
    },
    preConsultationReviewStatus: {
      reviewer: dataModel.aggregateRootValues["reviewer"],
      reviewerId: dataModel.aggregateRootValues["reviewerId"],
      reviewStatus: {
        status: dataModel.aggregateRootValues["reviewStatus"],
        ...(dataModel.aggregateRootValues["reviewStatus"] === "REJECTED"
          ? {
              comments: dataModel.aggregateRootValues["reviewComments"],
            }
          : {}),
      },
      reviewDate: dataModel.aggregateRootValues["reviewDate"],
    } as PreConsultationReviewStatus,
    preConsultationNotifications: {
      ...(getNotificationByType("MO_ASSIGNMENT_TO_HMT_AND_CMO") && {
        MO_ASSIGNMENT_TO_HMT_AND_CMO: {
          notificationId: getNotificationByType("MO_ASSIGNMENT_TO_HMT_AND_CMO")
            ?.notificationId as string,
          notifiedDate: getNotificationByType("MO_ASSIGNMENT_TO_HMT_AND_CMO")
            ?.notifiedDate as Date,
          notificationType: "MO_ASSIGNMENT_TO_HMT_AND_CMO",
        },
      }),

      ...(getNotificationByType("INQUIRY_APPROVAL_TO_CLIENT") && {
        INQUIRY_APPROVAL_TO_CLIENT: {
          notificationId: getNotificationByType("INQUIRY_APPROVAL_TO_CLIENT")
            ?.notificationId as string,
          notifiedDate: getNotificationByType("INQUIRY_APPROVAL_TO_CLIENT")
            ?.notifiedDate as Date,
          notificationType: "INQUIRY_APPROVAL_TO_CLIENT",
        },
      }),

      ...(getNotificationByType("PRICING_BROCHURE_TO_PATIENT") && {
        PRICING_BROCHURE_TO_PATIENT: {
          notificationId: getNotificationByType("PRICING_BROCHURE_TO_PATIENT")
            ?.notificationId as string,
          notifiedDate: getNotificationByType("PRICING_BROCHURE_TO_PATIENT")
            ?.notifiedDate as Date,
          notificationType: "PRICING_BROCHURE_TO_PATIENT",
        },
      }),

      ...(getNotificationByType("PHYSICIAN_PREFERENCE_TO_PMC") && {
        PHYSICIAN_PREFERENCE_TO_PMC: {
          notificationId: getNotificationByType("PHYSICIAN_PREFERENCE_TO_PMC")
            ?.notificationId as string,
          notifiedDate: getNotificationByType("PHYSICIAN_PREFERENCE_TO_PMC")
            ?.notifiedDate as Date,
          notificationType: "PHYSICIAN_PREFERENCE_TO_PMC",
        },
      }),

      ...(getNotificationByType("UPLOADED_REPORTS_TO_PMC") && {
        UPLOADED_REPORTS_TO_PMC: {
          notificationId: getNotificationByType("UPLOADED_REPORTS_TO_PMC")
            ?.notificationId as string,
          notifiedDate: getNotificationByType("UPLOADED_REPORTS_TO_PMC")
            ?.notifiedDate as Date,
          notificationType: "UPLOADED_REPORTS_TO_PMC",
        },
      }),

      ...(getNotificationByType("UPLOADED_PATIENT_GOVT_ID_TO_PMC") && {
        UPLOADED_PATIENT_GOVT_ID_TO_PMC: {
          notificationId: getNotificationByType(
            "UPLOADED_PATIENT_GOVT_ID_TO_PMC"
          )?.notificationId as string,
          notifiedDate: getNotificationByType("UPLOADED_PATIENT_GOVT_ID_TO_PMC")
            ?.notifiedDate as Date,
          notificationType: "UPLOADED_PATIENT_GOVT_ID_TO_PMC",
        },
      }),

      ...(getNotificationByType("PATIENT_GOVT_ID_VERIFIED_TO_PMC") && {
        PATIENT_GOVT_ID_VERIFIED_TO_PMC: {
          notificationId: getNotificationByType(
            "PATIENT_GOVT_ID_VERIFIED_TO_PMC"
          )?.notificationId as string,
          notifiedDate: getNotificationByType("PATIENT_GOVT_ID_VERIFIED_TO_PMC")
            ?.notifiedDate as Date,
          notificationType: "PATIENT_GOVT_ID_VERIFIED_TO_PMC",
        },
      }),

      ...(getNotificationByType("PATIENT_GOVT_ID_VERIFIED_TO_PATIENT") && {
        PATIENT_GOVT_ID_VERIFIED_TO_PATIENT: {
          notificationId: getNotificationByType(
            "PATIENT_GOVT_ID_VERIFIED_TO_PATIENT"
          )?.notificationId as string,
          notifiedDate: getNotificationByType(
            "PATIENT_GOVT_ID_VERIFIED_TO_PATIENT"
          )?.notifiedDate as Date,
          notificationType: "PATIENT_GOVT_ID_VERIFIED_TO_PATIENT",
        },
      }),

      ...(getNotificationByType("INQUIRY_APPROVED_BY_MO_TO_PATIENT") && {
        INQUIRY_APPROVED_BY_MO_TO_PATIENT: {
          notificationId: getNotificationByType(
            "INQUIRY_APPROVED_BY_MO_TO_PATIENT"
          )?.notificationId as string,
          notifiedDate: getNotificationByType(
            "INQUIRY_APPROVED_BY_MO_TO_PATIENT"
          )?.notifiedDate as Date,
          notificationType: "INQUIRY_APPROVED_BY_MO_TO_PATIENT",
        },
      }),

      ...(getNotificationByType("INQUIRY_APPROVED_BY_MO_TO_CLIENT") && {
        INQUIRY_APPROVED_BY_MO_TO_CLIENT: {
          notificationId: getNotificationByType(
            "INQUIRY_APPROVED_BY_MO_TO_CLIENT"
          )?.notificationId as string,
          notifiedDate: getNotificationByType(
            "INQUIRY_APPROVED_BY_MO_TO_CLIENT"
          )?.notifiedDate as Date,
          notificationType: "INQUIRY_APPROVED_BY_MO_TO_CLIENT",
        },
      }),

      ...(getNotificationByType("PRO_BONO_PAYMENT_TO_CLIENT") && {
        PRO_BONO_PAYMENT_TO_CLIENT: {
          notificationId: getNotificationByType("PRO_BONO_PAYMENT_TO_CLIENT")
            ?.notificationId as string,
          notifiedDate: getNotificationByType("PRO_BONO_PAYMENT_TO_CLIENT")
            ?.notifiedDate as Date,
          notificationType: "PRO_BONO_PAYMENT_TO_CLIENT",
        },
      }),

      ...(getNotificationByType("PRO_BONO_PAYMENT_APPROVED_TO_PATIENT") && {
        PRO_BONO_PAYMENT_APPROVED_TO_PATIENT: {
          notificationId: getNotificationByType(
            "PRO_BONO_PAYMENT_APPROVED_TO_PATIENT"
          )?.notificationId as string,
          notifiedDate: getNotificationByType(
            "PRO_BONO_PAYMENT_APPROVED_TO_PATIENT"
          )?.notifiedDate as Date,
          notificationType: "PRO_BONO_PAYMENT_APPROVED_TO_PATIENT",
        },
      }),

      ...(getNotificationByType("PRO_BONO_PAYMENT_APPROVED_TO_CLIENT") && {
        PRO_BONO_PAYMENT_APPROVED_TO_CLIENT: {
          notificationId: getNotificationByType(
            "PRO_BONO_PAYMENT_APPROVED_TO_CLIENT"
          )?.notificationId as string,
          notifiedDate: getNotificationByType(
            "PRO_BONO_PAYMENT_APPROVED_TO_CLIENT"
          )?.notifiedDate as Date,
          notificationType: "PRO_BONO_PAYMENT_APPROVED_TO_CLIENT",
        },
      }),

      ...(getNotificationByType("PRO_BONO_PAYMENT_APPROVED_TO_IRT") && {
        PRO_BONO_PAYMENT_APPROVED_TO_IRT: {
          notificationId: getNotificationByType(
            "PRO_BONO_PAYMENT_APPROVED_TO_IRT"
          )?.notificationId as string,
          notifiedDate: getNotificationByType(
            "PRO_BONO_PAYMENT_APPROVED_TO_IRT"
          )?.notifiedDate as Date,
          notificationType: "PRO_BONO_PAYMENT_APPROVED_TO_IRT",
        },
      }),

      ...(getNotificationByType("WIRE_TRANSFER_PAYMENT_TO_CLIENT") && {
        WIRE_TRANSFER_PAYMENT_TO_CLIENT: {
          notificationId: getNotificationByType(
            "WIRE_TRANSFER_PAYMENT_TO_CLIENT"
          )?.notificationId as string,
          notifiedDate: getNotificationByType("WIRE_TRANSFER_PAYMENT_TO_CLIENT")
            ?.notifiedDate as Date,
          notificationType: "WIRE_TRANSFER_PAYMENT_TO_CLIENT",
        },
      }),

      ...(getNotificationByType("WIRE_TRANSFER_PAYMENT_TO_NEWYORK_TEAM") && {
        WIRE_TRANSFER_PAYMENT_TO_NEWYORK_TEAM: {
          notificationId: getNotificationByType(
            "WIRE_TRANSFER_PAYMENT_TO_NEWYORK_TEAM"
          )?.notificationId as string,
          notifiedDate: getNotificationByType(
            "WIRE_TRANSFER_PAYMENT_TO_NEWYORK_TEAM"
          )?.notifiedDate as Date,
          notificationType: "WIRE_TRANSFER_PAYMENT_TO_NEWYORK_TEAM",
        },
      }),

      ...(getNotificationByType(
        "WIRE_TRANSFER_PAYMENT_APPROVED_TO_PATIENT"
      ) && {
        WIRE_TRANSFER_PAYMENT_APPROVED_TO_PATIENT: {
          notificationId: getNotificationByType(
            "WIRE_TRANSFER_PAYMENT_APPROVED_TO_PATIENT"
          )?.notificationId as string,
          notifiedDate: getNotificationByType(
            "WIRE_TRANSFER_PAYMENT_APPROVED_TO_PATIENT"
          )?.notifiedDate as Date,
          notificationType: "WIRE_TRANSFER_PAYMENT_APPROVED_TO_PATIENT",
        },
      }),

      ...(getNotificationByType("WIRE_TRANSFER_PAYMENT_APPROVED_TO_CLIENT") && {
        WIRE_TRANSFER_PAYMENT_APPROVED_TO_CLIENT: {
          notificationId: getNotificationByType(
            "WIRE_TRANSFER_PAYMENT_APPROVED_TO_CLIENT"
          )?.notificationId as string,
          notifiedDate: getNotificationByType(
            "WIRE_TRANSFER_PAYMENT_APPROVED_TO_CLIENT"
          )?.notifiedDate as Date,
          notificationType: "WIRE_TRANSFER_PAYMENT_APPROVED_TO_CLIENT",
        },
      }),

      ...(getNotificationByType("WIRE_TRANSFER_PAYMENT_APPROVED_TO_IRT") && {
        WIRE_TRANSFER_PAYMENT_APPROVED_TO_IRT: {
          notificationId: getNotificationByType(
            "WIRE_TRANSFER_PAYMENT_APPROVED_TO_IRT"
          )?.notificationId as string,
          notifiedDate: getNotificationByType(
            "WIRE_TRANSFER_PAYMENT_APPROVED_TO_IRT"
          )?.notifiedDate as Date,
          notificationType: "WIRE_TRANSFER_PAYMENT_APPROVED_TO_IRT",
        },
      }),

      ...(getNotificationByType("PAYMENT_GATEWAY_APPROVED_TO_PATIENT") && {
        PAYMENT_GATEWAY_APPROVED_TO_PATIENT: {
          notificationId: getNotificationByType(
            "PAYMENT_GATEWAY_APPROVED_TO_PATIENT"
          )?.notificationId as string,
          notifiedDate: getNotificationByType(
            "PAYMENT_GATEWAY_APPROVED_TO_PATIENT"
          )?.notifiedDate as Date,
          notificationType: "PAYMENT_GATEWAY_APPROVED_TO_PATIENT",
        },
      }),

      ...(getNotificationByType("PAYMENT_GATEWAY_APPROVED_TO_CLIENT") && {
        PAYMENT_GATEWAY_APPROVED_TO_CLIENT: {
          notificationId: getNotificationByType(
            "PAYMENT_GATEWAY_APPROVED_TO_CLIENT"
          )?.notificationId as string,
          notifiedDate: getNotificationByType(
            "PAYMENT_GATEWAY_APPROVED_TO_CLIENT"
          )?.notifiedDate as Date,
          notificationType: "PAYMENT_GATEWAY_APPROVED_TO_CLIENT",
        },
      }),

      ...(getNotificationByType("PAMENT_GATEWAY_APPROVED_TO_IRT") && {
        PAMENT_GATEWAY_APPROVED_TO_IRT: {
          notificationId: getNotificationByType(
            "PAMENT_GATEWAY_APPROVED_TO_IRT"
          )?.notificationId as string,
          notifiedDate: getNotificationByType("PAMENT_GATEWAY_APPROVED_TO_IRT")
            ?.notifiedDate as Date,
          notificationType: "PAMENT_GATEWAY_APPROVED_TO_IRT",
        },
      }),

      ...(getNotificationByType("PATIENT_GOVT_ID_REJECTED_TO_PMC") && {
        PATIENT_GOVT_ID_REJECTED_TO_PMC: {
          notificationId: getNotificationByType(
            "PATIENT_GOVT_ID_REJECTED_TO_PMC"
          )?.notificationId as string,
          notifiedDate: getNotificationByType("PATIENT_GOVT_ID_REJECTED_TO_PMC")
            ?.notifiedDate as Date,
          notificationType: "PATIENT_GOVT_ID_REJECTED_TO_PMC",
          notificationComment: getNotificationByType(
            "PATIENT_GOVT_ID_REJECTED_TO_PMC"
          )?.notificationComment as string,
        },
      }),

      ...(getNotificationByType("PATIENT_GOVT_ID_REJECTED_TO_PATIENT") && {
        PATIENT_GOVT_ID_REJECTED_TO_PATIENT: {
          notificationId: getNotificationByType(
            "PATIENT_GOVT_ID_REJECTED_TO_PATIENT"
          )?.notificationId as string,
          notifiedDate: getNotificationByType(
            "PATIENT_GOVT_ID_REJECTED_TO_PATIENT"
          )?.notifiedDate as Date,
          notificationType: "PATIENT_GOVT_ID_REJECTED_TO_PATIENT",
          notificationComment: getNotificationByType(
            "PATIENT_GOVT_ID_REJECTED_TO_PATIENT"
          )?.notificationComment as string,
        },
      }),

      ...(getNotificationByType("INQUIRY_REJECTED_BY_MO_TO_PATIENT") && {
        INQUIRY_REJECTED_BY_MO_TO_PATIENT: {
          notificationId: getNotificationByType(
            "INQUIRY_REJECTED_BY_MO_TO_PATIENT"
          )?.notificationId as string,
          notifiedDate: getNotificationByType(
            "INQUIRY_REJECTED_BY_MO_TO_PATIENT"
          )?.notifiedDate as Date,
          notificationType: "INQUIRY_REJECTED_BY_MO_TO_PATIENT",
          notificationComment: getNotificationByType(
            "INQUIRY_REJECTED_BY_MO_TO_PATIENT"
          )?.notificationComment as string,
        },
      }),

      ...(getNotificationByType("INQUIRY_REJECTED_BY_MO_TO_CLIENT") && {
        INQUIRY_REJECTED_BY_MO_TO_CLIENT: {
          notificationId: getNotificationByType(
            "INQUIRY_REJECTED_BY_MO_TO_CLIENT"
          )?.notificationId as string,
          notifiedDate: getNotificationByType(
            "INQUIRY_REJECTED_BY_MO_TO_CLIENT"
          )?.notifiedDate as Date,
          notificationType: "INQUIRY_REJECTED_BY_MO_TO_CLIENT",
          notificationComment: getNotificationByType(
            "INQUIRY_REJECTED_BY_MO_TO_CLIENT"
          )?.notificationComment as string,
        },
      }),

      ...(getNotificationByType("PRO_BONO_PAYMENT_REJECTED_TO_PATIENT") && {
        PRO_BONO_PAYMENT_REJECTED_TO_PATIENT: {
          notificationId: getNotificationByType(
            "PRO_BONO_PAYMENT_REJECTED_TO_PATIENT"
          )?.notificationId as string,
          notifiedDate: getNotificationByType(
            "PRO_BONO_PAYMENT_REJECTED_TO_PATIENT"
          )?.notifiedDate as Date,
          notificationType: "PRO_BONO_PAYMENT_REJECTED_TO_PATIENT",
          notificationComment: getNotificationByType(
            "PRO_BONO_PAYMENT_REJECTED_TO_PATIENT"
          )?.notificationComment as string,
        },
      }),

      ...(getNotificationByType("PRO_BONO_PAYMENT_REJECTED_TO_CLIENT") && {
        PRO_BONO_PAYMENT_REJECTED_TO_CLIENT: {
          notificationId: getNotificationByType(
            "PRO_BONO_PAYMENT_REJECTED_TO_CLIENT"
          )?.notificationId as string,
          notifiedDate: getNotificationByType(
            "PRO_BONO_PAYMENT_REJECTED_TO_CLIENT"
          )?.notifiedDate as Date,
          notificationType: "PRO_BONO_PAYMENT_REJECTED_TO_CLIENT",
          notificationComment: getNotificationByType(
            "PRO_BONO_PAYMENT_REJECTED_TO_CLIENT"
          )?.notificationComment as string,
        },
      }),

      ...(getNotificationByType(
        "WIRE_TRANSFER_PAYMENT_REJECTED_TO_PATIENT"
      ) && {
        WIRE_TRANSFER_PAYMENT_REJECTED_TO_PATIENT: {
          notificationId: getNotificationByType(
            "WIRE_TRANSFER_PAYMENT_REJECTED_TO_PATIENT"
          )?.notificationId as string,
          notifiedDate: getNotificationByType(
            "WIRE_TRANSFER_PAYMENT_REJECTED_TO_PATIENT"
          )?.notifiedDate as Date,
          notificationType: "WIRE_TRANSFER_PAYMENT_REJECTED_TO_PATIENT",
          notificationComment: getNotificationByType(
            "WIRE_TRANSFER_PAYMENT_REJECTED_TO_PATIENT"
          )?.notificationComment as string,
        },
      }),

      ...(getNotificationByType("WIRE_TRANSFER_PAYMENT_REJECTED_TO_CLIENT") && {
        WIRE_TRANSFER_PAYMENT_REJECTED_TO_CLIENT: {
          notificationId: getNotificationByType(
            "WIRE_TRANSFER_PAYMENT_REJECTED_TO_CLIENT"
          )?.notificationId as string,
          notifiedDate: getNotificationByType(
            "WIRE_TRANSFER_PAYMENT_REJECTED_TO_CLIENT"
          )?.notifiedDate as Date,
          notificationType: "WIRE_TRANSFER_PAYMENT_REJECTED_TO_CLIENT",
          notificationComment: getNotificationByType(
            "WIRE_TRANSFER_PAYMENT_REJECTED_TO_CLIENT"
          )?.notificationComment as string,
        },
      }),

      ...(getNotificationByType("PAYMENT_GATEWAY_REJECTED_TO_PATIENT") && {
        PAYMENT_GATEWAY_REJECTED_TO_PATIENT: {
          notificationId: getNotificationByType(
            "PAYMENT_GATEWAY_REJECTED_TO_PATIENT"
          )?.notificationId as string,
          notifiedDate: getNotificationByType(
            "PAYMENT_GATEWAY_REJECTED_TO_PATIENT"
          )?.notifiedDate as Date,
          notificationType: "PAYMENT_GATEWAY_REJECTED_TO_PATIENT",
          notificationComment: getNotificationByType(
            "PAYMENT_GATEWAY_REJECTED_TO_PATIENT"
          )?.notificationComment as string,
        },
      }),

      ...(getNotificationByType("PAYMENT_GATEWAY_REJECTED_TO_CLIENT") && {
        PAYMENT_GATEWAY_REJECTED_TO_CLIENT: {
          notificationId: getNotificationByType(
            "PAYMENT_GATEWAY_REJECTED_TO_CLIENT"
          )?.notificationId as string,
          notifiedDate: getNotificationByType(
            "PAYMENT_GATEWAY_REJECTED_TO_CLIENT"
          )?.notifiedDate as Date,
          notificationType: "PAYMENT_GATEWAY_REJECTED_TO_CLIENT",
          notificationComment: getNotificationByType(
            "PAYMENT_GATEWAY_REJECTED_TO_CLIENT"
          )?.notificationComment as string,
        },
      }),
    },
    preConsultationReminders: {
      ...(getReminderByType("SERVICE_SELECTION_REMINDER_FOR_PATIENT") && {
        SERVICE_SELECTION_REMINDER_FOR_PATIENT: {
          reminderId: getReminderByType(
            "SERVICE_SELECTION_REMINDER_FOR_PATIENT"
          )?.reminderId as string,
          createdDate: getReminderByType(
            "SERVICE_SELECTION_REMINDER_FOR_PATIENT"
          )?.createdDate as Date,
          reminderStatus: {
            status: getReminderByType("SERVICE_SELECTION_REMINDER_FOR_PATIENT")
              ?.reminderStatus,

            ...(getReminderByType("SERVICE_SELECTION_REMINDER_FOR_PATIENT")
              ?.reminderStatus === "CANCELLED" && {
              reminderCancelledDate: getReminderByType(
                "SERVICE_SELECTION_REMINDER_FOR_PATIENT"
              )?.reminderCancelledDate as Date,
            }),
          } as Pending | Sent | Cancelled,
          reminderDate: getReminderByType(
            "SERVICE_SELECTION_REMINDER_FOR_PATIENT"
          )?.reminderDate as Date,
          reminderType: "SERVICE_SELECTION_REMINDER_FOR_PATIENT",
        },
      }),

      ...(getReminderByType("SERVICE_SELECTION_REMINDER_FOR_CLIENT") && {
        SERVICE_SELECTION_REMINDER_FOR_CLIENT: {
          reminderId: getReminderByType("SERVICE_SELECTION_REMINDER_FOR_CLIENT")
            ?.reminderId as string,
          createdDate: getReminderByType(
            "SERVICE_SELECTION_REMINDER_FOR_CLIENT"
          )?.createdDate as Date,
          reminderStatus: {
            status: getReminderByType("SERVICE_SELECTION_REMINDER_FOR_CLIENT")
              ?.reminderStatus,

            ...(getReminderByType("SERVICE_SELECTION_REMINDER_FOR_CLIENT")
              ?.reminderStatus === "CANCELLED" && {
              reminderCancelledDate: getReminderByType(
                "SERVICE_SELECTION_REMINDER_FOR_CLIENT"
              )?.reminderCancelledDate as Date,
            }),
          } as Pending | Sent | Cancelled,
          reminderDate: getReminderByType(
            "SERVICE_SELECTION_REMINDER_FOR_CLIENT"
          )?.reminderDate as Date,
          reminderType: "SERVICE_SELECTION_REMINDER_FOR_CLIENT",
        },
      }),

      ...(getReminderByType("COURIER_SAMPLE_SLIDES_REMINDER_FOR_PATIENT") && {
        COURIER_SAMPLE_SLIDES_REMINDER_FOR_PATIENT: {
          reminderId: getReminderByType(
            "COURIER_SAMPLE_SLIDES_REMINDER_FOR_PATIENT"
          )?.reminderId as string,
          createdDate: getReminderByType(
            "COURIER_SAMPLE_SLIDES_REMINDER_FOR_PATIENT"
          )?.createdDate as Date,
          reminderStatus: {
            status: getReminderByType(
              "COURIER_SAMPLE_SLIDES_REMINDER_FOR_PATIENT"
            )?.reminderStatus,

            ...(getReminderByType("COURIER_SAMPLE_SLIDES_REMINDER_FOR_PATIENT")
              ?.reminderStatus === "CANCELLED" && {
              reminderCancelledDate: getReminderByType(
                "COURIER_SAMPLE_SLIDES_REMINDER_FOR_PATIENT"
              )?.reminderCancelledDate as Date,
            }),
          } as Pending | Sent | Cancelled,
          reminderDate: getReminderByType(
            "COURIER_SAMPLE_SLIDES_REMINDER_FOR_PATIENT"
          )?.reminderDate as Date,
          reminderType: "COURIER_SAMPLE_SLIDES_REMINDER_FOR_PATIENT",
        },
      }),

      ...(getReminderByType("COURIER_SAMPLE_SLIDES_REMINDER_FOR_CLIENT") && {
        COURIER_SAMPLE_SLIDES_REMINDER_FOR_CLIENT: {
          reminderId: getReminderByType(
            "COURIER_SAMPLE_SLIDES_REMINDER_FOR_CLIENT"
          )?.reminderId as string,
          createdDate: getReminderByType(
            "COURIER_SAMPLE_SLIDES_REMINDER_FOR_CLIENT"
          )?.createdDate as Date,
          reminderStatus: {
            status: getReminderByType(
              "COURIER_SAMPLE_SLIDES_REMINDER_FOR_CLIENT"
            )?.reminderStatus,

            ...(getReminderByType("COURIER_SAMPLE_SLIDES_REMINDER_FOR_CLIENT")
              ?.reminderStatus === "CANCELLED" && {
              reminderCancelledDate: getReminderByType(
                "COURIER_SAMPLE_SLIDES_REMINDER_FOR_CLIENT"
              )?.reminderCancelledDate as Date,
            }),
          } as Pending | Sent | Cancelled,
          reminderDate: getReminderByType(
            "COURIER_SAMPLE_SLIDES_REMINDER_FOR_CLIENT"
          )?.reminderDate as Date,
          reminderType: "COURIER_SAMPLE_SLIDES_REMINDER_FOR_CLIENT",
        },
      }),

      ...(getReminderByType("MEDICAL_REPORTS_REMINDER_FOR_PATIENT") && {
        MEDICAL_REPORTS_REMINDER_FOR_PATIENT: {
          reminderId: getReminderByType("MEDICAL_REPORTS_REMINDER_FOR_PATIENT")
            ?.reminderId as string,
          createdDate: getReminderByType("MEDICAL_REPORTS_REMINDER_FOR_PATIENT")
            ?.createdDate as Date,
          reminderStatus: {
            status: getReminderByType("MEDICAL_REPORTS_REMINDER_FOR_PATIENT")
              ?.reminderStatus,

            ...(getReminderByType("MEDICAL_REPORTS_REMINDER_FOR_PATIENT")
              ?.reminderStatus === "CANCELLED" && {
              reminderCancelledDate: getReminderByType(
                "MEDICAL_REPORTS_REMINDER_FOR_PATIENT"
              )?.reminderCancelledDate as Date,
            }),
          } as Pending | Sent | Cancelled,
          reminderDate: getReminderByType(
            "MEDICAL_REPORTS_REMINDER_FOR_PATIENT"
          )?.reminderDate as Date,
          reminderType: "MEDICAL_REPORTS_REMINDER_FOR_PATIENT",
        },
      }),

      ...(getReminderByType("MEDICAL_REPORTS_REMINDER_FOR_CLIENT") && {
        MEDICAL_REPORTS_REMINDER_FOR_CLIENT: {
          reminderId: getReminderByType("MEDICAL_REPORTS_REMINDER_FOR_CLIENT")
            ?.reminderId as string,
          createdDate: getReminderByType("MEDICAL_REPORTS_REMINDER_FOR_CLIENT")
            ?.createdDate as Date,
          reminderStatus: {
            status: getReminderByType("MEDICAL_REPORTS_REMINDER_FOR_CLIENT")
              ?.reminderStatus,

            ...(getReminderByType("MEDICAL_REPORTS_REMINDER_FOR_CLIENT")
              ?.reminderStatus === "CANCELLED" && {
              reminderCancelledDate: getReminderByType(
                "MEDICAL_REPORTS_REMINDER_FOR_CLIENT"
              )?.reminderCancelledDate as Date,
            }),
          } as Pending | Sent | Cancelled,
          reminderDate: getReminderByType("MEDICAL_REPORTS_REMINDER_FOR_CLIENT")
            ?.reminderDate as Date,
          reminderType: "MEDICAL_REPORTS_REMINDER_FOR_CLIENT",
        },
      }),

      ...(getReminderByType("GOVT_IDENTIFICATION_REMINDER_FOR_PATIENT") && {
        GOVT_IDENTIFICATION_REMINDER_FOR_PATIENT: {
          reminderId: getReminderByType(
            "GOVT_IDENTIFICATION_REMINDER_FOR_PATIENT"
          )?.reminderId as string,
          createdDate: getReminderByType(
            "GOVT_IDENTIFICATION_REMINDER_FOR_PATIENT"
          )?.createdDate as Date,
          reminderStatus: {
            status: getReminderByType(
              "GOVT_IDENTIFICATION_REMINDER_FOR_PATIENT"
            )?.reminderStatus,

            ...(getReminderByType("GOVT_IDENTIFICATION_REMINDER_FOR_PATIENT")
              ?.reminderStatus === "CANCELLED" && {
              reminderCancelledDate: getReminderByType(
                "GOVT_IDENTIFICATION_REMINDER_FOR_PATIENT"
              )?.reminderCancelledDate as Date,
            }),
          } as Pending | Sent | Cancelled,
          reminderDate: getReminderByType(
            "GOVT_IDENTIFICATION_REMINDER_FOR_PATIENT"
          )?.reminderDate as Date,
          reminderType: "GOVT_IDENTIFICATION_REMINDER_FOR_PATIENT",
        },
      }),

      ...(getReminderByType("GOVT_IDENTIFICATION_REMINDER_FOR_CLIENT") && {
        GOVT_IDENTIFICATION_REMINDER_FOR_CLIENT: {
          reminderId: getReminderByType(
            "GOVT_IDENTIFICATION_REMINDER_FOR_CLIENT"
          )?.reminderId as string,
          createdDate: getReminderByType(
            "GOVT_IDENTIFICATION_REMINDER_FOR_CLIENT"
          )?.createdDate as Date,
          reminderStatus: {
            status: getReminderByType("GOVT_IDENTIFICATION_REMINDER_FOR_CLIENT")
              ?.reminderStatus,

            ...(getReminderByType("GOVT_IDENTIFICATION_REMINDER_FOR_CLIENT")
              ?.reminderStatus === "CANCELLED" && {
              reminderCancelledDate: getReminderByType(
                "GOVT_IDENTIFICATION_REMINDER_FOR_CLIENT"
              )?.reminderCancelledDate as Date,
            }),
          } as Pending | Sent | Cancelled,
          reminderDate: getReminderByType(
            "GOVT_IDENTIFICATION_REMINDER_FOR_CLIENT"
          )?.reminderDate as Date,
          reminderType: "GOVT_IDENTIFICATION_REMINDER_FOR_CLIENT",
        },
      }),
    },
  };

  return preConsultationDataToDomainMapper;
};

export const directusSchema: Schema = {
  aggregateRootCollectionSchema: {
    name: preConsultationPreConsultation,
    fields: [
      "id",
      "name",
      "version",
      "auditHistory",
      "comments",
      "inquiryId",
      "paymentReferenceId",
      "IRN",
      "services",
      "preferredPhysicianName",
      "isMultiMdConsult",
      "supplimentaryServices",
      "slideType",
      "pathologyType",
      "courierType",
      "trackingId",
      "contactPersonName",
      "contactPersonPhone",
      "collectSpecimenFrom",
      "reviewer",
      "reviewerId",
      "reviewStatus",
      "reviewDate",
      "reviewComments",
    ],
  },
  aggregateChildremCollectionsSchemas: [
    {
      name: preConsultationMedicalReport,
      fields: [
        "id",
        "aggregateName",
        "aggregateId",
        "reportCategory",
        "reportType",
        "reportDescription",
        "reportTakenDate",
        "referenceDocumentId",
        "reportStatus",
        "IRN",
      ],
    },
    {
      name: preConsultationPatientGovtIdentification,
      fields: [
        "id",
        "aggregateName",
        "aggregateId",
        "identificationType",
        "identificationNumber",
        "otherIdentificationName",
        "identificationStatus",
        "IRN",
        "referenceDocumentId",
      ],
    },
    {
      name: preConsultationAssignment,
      fields: [
        "id",
        "aggregateName",
        "aggregateId",
        "assignedTo",
        "assignedDate",
        "assignedUserId",
        "assignmentMode",
        "assignedByUserId",
        "IRN",
      ],
    },
    {
      name: preConsultationReminder,
      fields: [
        "id",
        "aggregateName",
        "aggregateId",
        "createdDate",
        "reminderId",
        "reminderStatus",
        "reminderDate",
        "reminderType",
        "reminderCancelledDate",
        "IRN",
      ],
    },
    {
      name: preConsultationNotification,
      fields: [
        "id",
        "aggregateName",
        "aggregateId",
        "notificationId",
        "notifiedDate",
        "notificationType",
        "notificationComments",
        "IRN",
      ],
    },
  ],
};
