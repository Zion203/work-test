import { IOError, IOErrorObject } from "@icliniqSmartDoctor/shared-kernel";
import { expect } from "vitest";
import { PreConsultation } from "../src/core/domain/model/types/pre-consultation-aggregate.js";
import { DataModel } from "@icliniqSmartDoctor/reactive-framework";
import {
  preConsultationPreConsultation,
  preConsultationAssignment,
  preConsultationMedicalReport,
  preConsultationPatientGovtIdentification,
  preConsultationReminder,
  preConsultationNotification,
} from "../src/adapter/outbound/collections.js";

import {
  InquiryServiceGateway,
  AssignedUsersOfInquiryQuery,
  AssignedUsersOfInquiryResponse,
  AssignedUsersOfInquiryError,
  InquiriesOfMtQuery,
  InquiriesOfUserResponse,
  InquiriesOfUserResponseError,
  InquiriesOfPmcQuery,
  InquiryOfIrnQuery,
  InquiryResponse,
  InquiryResponseError,
  NotificationServiceGateway,
  NotifyCommand,
  NotifyError,
  NotifyResponse,
} from "@icliniqSmartDoctor/compresecond-shared-kernel";
import { Result } from "true-myth";

export const samplePreConsultation = (): PreConsultation => {
  return {
    id: "123456",
    name: "PreConsultation",
    IRN: "IRN001",
    isNew: true,
    inquiryId: "INQ001",
    version: 1,
    versionComments: "Create a new consultation",
    auditHistory: new Set([
      {
        comments: "Create a new consultation",
        version: 1,
        createdBy: "user1",
        commandName: "CreateConsultation",
        timestamp: expect.any(Date),
      },
    ]),
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
    medicalReports: [
      {
        category: "LAB_REPORTS",
        reportType: "testReport",
        description: "sample description",
        takenDate: new Date(),
        referenceDocument: { id: "RR1234" },
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
    paymentReference: {
      id: "PR1234",
    },
    assignments: {
      MO: {
        preConsultationAssignementId: "1234567890",
        assignedTo: "MO",
        assignedUserId: "1234",
        assignedDate: new Date(),
        assignmentMode: {
          assignedBy: "MANUAL",
          assignedByUserId: "456",
        },
      },
    },
    preConsultationReviewStatus: {
      reviewer: "MO",
      reviewerId: "1234",
      reviewStatus: {
        status: "REJECTED",
        comments: "sample review comments",
      },
      reviewDate: new Date(),
    },
    preConsultationReminders: {
      SERVICE_SELECTION_REMINDER_FOR_PATIENT: {
        reminderId: "1111",
        createdDate: new Date(),
        reminderStatus: { status: "SENT" },
        reminderDate: new Date(),
        reminderType: "SERVICE_SELECTION_REMINDER_FOR_PATIENT",
      },
    },
    preConsultationNotifications: {
      MO_ASSIGNMENT_TO_HMT_AND_CMO: {
        notificationId: "1111",
        notifiedDate: new Date(),
        notificationType: "MO_ASSIGNMENT_TO_HMT_AND_CMO",
      },
      PATIENT_GOVT_ID_REJECTED_TO_PMC: {
        notificationId: "1111",
        notifiedDate: new Date(),
        notificationType: "PATIENT_GOVT_ID_REJECTED_TO_PMC",
        notificationComment: "sample notification comments",
      },
    },
  };
};

export const executeResultError = (): IOError<IOErrorObject> => ({
  type: "IOError",
  error: {
    type: "someType",
    code: "IOError",
    description: "someDescription",
    systemError: "someSystemError",
  },
  subtype: "InternalServerError",
  severity: "HIGH",
});

export const samplePreConsultationDataModel = (): DataModel => {
  return {
    aggregateRootCollectionName: preConsultationPreConsultation,
    aggregateRootValues: {
      id: "123456",
      name: "PreConsultation",
      version: 1,
      comments: "versionComments",
      auditHistory: {
        history: [
          {
            createdBy: "testUserId",
            comments: "Create a new pre consultation",
            version: 1,
            commandName: "CreatePreConsultation",
            timestamp: expect.any(Date),
          },
        ],
      },
      inquiryId: "INQ001",
      IRN: "IRN001",
      services: ["VIDEO_CONSULTATION", "PATHOLOGY_REVIEW"],
      preferredPhysicianName: "Dr. Smith",
      supplimentaryServices: ["INTEGRATIVE_MEDICINE"],
      isMultiMdConsult: false,
      slideType: "STAINED_SLIDES",
      pathologyType: "STANDARD_PATHOLOGY",
      courierType: "SELF_COURIER",
      trackingId: "12345",
      contactPersonName: "John Doe",
      contactPersonPhone: "1234567890",
      paymentReferenceId: "PAY001",
      preConsultationReviewStatus: "PENDING",
      reviewer: "MO",
      reviewerId: "MO-001",
      reviewStatus: "APPROVED",
      reviewDate: expect.any(Date),
    },
    aggregateChildrenCollections: [
      {
        aggregateChildCollectionName: preConsultationAssignment,
        items: [
          {
            assignedDate: expect.any(Date),
            assignedTo: "MO",
            assignedUserId: "USER001",
            assignmentMode: "MANUAL",
            assignedByUserId: "USER002",
            id: "1234567890",
            aggregateId: "01HYFXNARKYK4QF5EBC3",
            aggregateName: "PreConsultation",
          },
        ],
      },
      {
        aggregateChildCollectionName: preConsultationMedicalReport,
        items: [
          {
            reportCategory: "LAB_REPORTS",
            reportType: "BIOPSY",
            reportDescription: "Biopsy report",
            reportTakenDate: expect.any(Date),
            referenceDocumentId: "REF001",
            id: "1234567890",
            aggregateId: "01HYFXNARKYK4QF5EBC3",
            aggregateName: "PreConsultation",
          },
        ],
      },
      {
        aggregateChildCollectionName: preConsultationReminder,
        items: [
          {
            reminderId: "REM001",
            createdDate: expect.any(Date),
            reminderStatus: "CANCELLED",
            reminderCancelledDate: expect.any(Date),
            reminderDate: expect.any(Date),
            reminderType: "SERVICE_SELECTION_REMINDER_FOR_PATIENT",
            id: "1234567890",
            aggregateId: "01HYFXNARKYK4QF5EBC3",
            aggregateName: "PreConsultation",
          },
        ],
      },
      {
        aggregateChildCollectionName: preConsultationPatientGovtIdentification,
        items: [
          {
            identificationType: "AADHAAR_CARD",
            identificationNumber: "123456789012",
            id: "ID001",
            aggregateId: "01HYFXNARKYK4QF5EBC3",
            aggregateName: "PreConsultation",
            referenceDocumentId: "RI1234",
          },
        ],
      },
      {
        aggregateChildCollectionName: preConsultationNotification,
        items: [
          {
            notificationId: "NOTIF-001",
            notifiedDate: expect.any(Date),
            notificationType: "MO_ASSIGNMENT_TO_HMT_AND_CMO",
            id: "1234567890",
            aggregateId: "01HYFXNARKYK4QF5EBC3",
            aggregateName: "PreConsultation",
          },
          {
            notificationId: "NOTIF-002",
            notifiedDate: expect.any(Date),
            notificationType: "PATIENT_GOVT_ID_REJECTED_TO_PMC",
            notificationComment: "Govt ID rejected",
            id: "1234567891",
            aggregateId: "01HYFXNARKYK4QF5EBC3",
            aggregateName: "PreConsultation",
          },
        ],
      },
    ],
  };
};

export const mockInquiryServiceGatewayForInquiryDetail =
  (): InquiryServiceGateway => {
    return {
      getAssignedUsers: async (
        inquiryAssignedUsers: AssignedUsersOfInquiryQuery
      ): Promise<
        Result<AssignedUsersOfInquiryResponse, AssignedUsersOfInquiryError>
      > => {
        return Promise.reject("not applicable");
      },
      getInquiriesOfMt: async (
        inquiriesOfMt: InquiriesOfMtQuery
      ): Promise<
        Result<InquiriesOfUserResponse, InquiriesOfUserResponseError>
      > => {
        return Promise.reject("not applicable");
      },
      getInquiriesOfPmc: async (
        inquiriesOfPmc: InquiriesOfPmcQuery
      ): Promise<
        Result<InquiriesOfUserResponse, InquiriesOfUserResponseError>
      > => {
        return Promise.reject("not applicable");
      },
      getInquiryByIrn: async (
        inquiryOfIrn: InquiryOfIrnQuery
      ): Promise<Result<InquiryResponse, InquiryResponseError>> => {
        const inquiry = [
          {
            id: "01HYFXNARKYK4QF5EBC3CNZJ4G",
            name: "Inquiry",
            version: "1",
            auditHistory: {
              history: [
                {
                  comments: "description",
                  version: 1,
                  createdBy: "",
                  commandName: "InquiryName",
                  timestamp: new Date("2024-05-22T10:30:59.091Z"),
                },
              ],
            },
            comments: "Inquiry",
            IRN: "01HYFXNARKHQ45JPJSCPV6ED2K",
            firstName: "firstName",
            lastName: "lastName",
            gender: "MALE",
            dateOfBirth: new Date("2024-05-05"),
            genderAtBirth: "MALE",
            citizenship: "AFGHAN",
            street: "street",
            city: "city",
            state: "state",
            country: "country",
            postalCode: "123456",
            contactType: "PHONE",
            email: "dfdsfdsfds@y.com",
            phone: "+918190099918",
            diagnosisStatus: "NEWLY_DIAGNOSED",
            typeOfAssistance: "TRAVEL_TO_MSK_NEW_YORK",
            isPatientHospitalized: true,
            additionalCare: "additionalCare",
            cancerType: "cancerType",
            bestTimeToContact: ["bestTimeToContact", "bestTimeToContact"],
            languageInterpretationRequired: true,
            language: "language",
            ageLimit: "Above18",
            ageConsented: 1, // wrong type need to fix
            termsAndConditionsAccepted: true,
            termsAndConditionsAcceptedDate: new Date("2024-05-23T00:00:00"),
            termsAndConditionsVersion: "termsAndConditionsVersion",
            reference: "reference",
            physicianName: null,
            hospitalFacilityName: null,
            articleDetails: null,
            otherReferenceDetails: "other Details",
            sourceOfEnquiry: "PHONE",
            inquiryCreatedUserId: null,
            careGiverRelationship: null,
            careGiverFirstName: null,
            careGiverLastName: null,
            careGiverEmail: null,
            careGiverPhone: null,
            othersDetails: null,
            inquiryCreatedBy: "PATIENT",
            patientUserId: "1234",
            patientAdditionalEmail: ["1@gmail.com", "2@gmail.com"],
            patientAdditionalPhone: ["+918190099918", "+918190099918"],
            patientPrimaryEmail: "patientPrimaryEmail",
            patientPrimaryPhone: "patientPrimaryPhone",
            phoneType: "",
            otherCancerType: "",
            creatorUserId: "",
            careGiverPrimaryEmail: "",
            careGiverPrimaryPhone: "",
            creatorOthersDetails: "",
            creatorType: "PATIENT",
            inquiryStatus: "ACTIVE",
            reviewer: "",
            reviewerId: "",
            reviewStatus: "",
          },
        ];
        const response: InquiryResponse = {
          inquiryOfIrn: inquiry,
        };

        return Promise.resolve(Result.ok(response));
      },
    };
  };

export const aggregate: PreConsultation = {
  id: "AGG12345",
  name: "PreConsultation",
  version: 1,
  versionComments: "versionComments",
  auditHistory: new Set(),
  isNew: true,
  inquiryId: "INQ98765",
  IRN: "IRN12345",
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
};

export const mockNotificationServiceGateway =
  (): NotificationServiceGateway => {
    return {
      notification: async (
        notifyCommand: NotifyCommand
      ): Promise<Result<NotifyResponse, NotifyError>> => {
        const response: NotifyResponse = {
          aggregateId: "98999933334444",
        };
        return Promise.resolve(Result.ok(response));
      },
    };
  };