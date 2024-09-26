import type { Aggregate } from "@icliniqSmartDoctor/reactive-framework";

export type AdminRole = "CMO" | "HMT";

export type PreConsultation = Aggregate<PreConsultation, "PreConsultation"> & {
  inquiryId: string;
  IRN: string;
  services: Service[];
  medicalReports?: MedicalReport[];
  patientGovtIdentifications?: PatientGovtIdentification[];
  paymentReference?: PaymentReference;
  assignments?: PreConsultationAssignment;
  preConsultationReviewStatus?: PreConsultationReviewStatus;
  preConsultationReminders?: PreConsultationReminder;
  preConsultationNotifications?: PreConsultationNotification;
};

export type Service =
  | VideoConsultation
  | WrittenConsultation
  | PathologyReview
  | RadiologyReview
  | TravelToNewYork;

export type VideoConsultation = {
  name: "VIDEO_CONSULTATION";
  preferredPhysicianName?: string;
  supplimentaryServices?: SupplimentaryService[];
  isMultiMdConsult?: boolean;
};

export type WrittenConsultation = {
  name: "WRITTEN_CONSULTATION";
  preferredPhysicianName?: string;
  supplimentaryServices?: SupplimentaryService[];
  isMultiMdConsult?: boolean;
};

export type RadiologyReview = {
  name: "RADIOLOGY_REVIEW";
};

export type TravelToNewYork = {
  name: "TRAVEL_TO_MSK_NEW_YORK";
};

export type PathologyReview = {
  name: "PATHOLOGY_REVIEW";
  slideType: SlideType;
};

export type SupplimentaryService = IntegrativeMedicine | OncologyPainManagement;

export type IntegrativeMedicine = {
  name: "INTEGRATIVE_MEDICINE";
};

export type OncologyPainManagement = {
  name: "ONCOLOGY_PAIN_MANAGEMENT";
};

export type SlideType =
  | StainedSlides
  | UnstainedSlides
  | PathologyBlock
  | UnstainedSlidesAndPathologyBlock
  | StainedSlidesAndPathologyBlock
  | None;

export type StainedSlides = {
  type: "STAINED_SLIDES";
  pathologyType: StandardPathologyType;
};

export type UnstainedSlides = {
  type: "UNSTAINED_SLIDES";
  pathologyType: ExtensivePathologyType;
};

export type PathologyBlock = {
  type: "PATHOLOGY_BLOCK";
  pathologyType: ExtensivePathologyType;
};

export type UnstainedSlidesAndPathologyBlock = {
  type: "UNSTAINED_SLIDES_AND_PATHOLOGY_BLOCK";
  pathologyType: ExtensivePathologyType;
};

export type StainedSlidesAndPathologyBlock = {
  type: "STAINED_SLIDES_AND_PATHOLOGY_BLOCK";
  pathologyType: StandardPathologyType | ExtensivePathologyType;
};

export type None = {
  type: "NONE";
};

export type StandardPathologyType = {
  type: "STANDARD_PATHOLOGY";
  courierDetails: SelfCourier;
};

export type ExtensivePathologyType = {
  type: "EXTENSIVE_PATHOLOGY";
  courierDetails: SelfCourier | PickUpAssistance;
};

export type SelfCourier = {
  courierType: "SELF_COURIER";
  trackingId: string;
  contactPersonName: string;
  contactPersonPhone: string;
};

export type PickUpAssistance = {
  courierType: "PICK_UP_ASSISTANCE";
  collectSpecimenFrom: CollectSpecimenFrom;
};

export type CollectSpecimenFrom = "LOCATION" | "HOSPITAL";

export type MedicalReport = {
  category: ReportCategory;
  reportType: string;
  description?: string;
  takenDate?: Date;
  referenceDocument?: ReferenceDocument;
};

export type ReportCategory = "LAB_REPORTS" | "RADIOLOGY_IMAGES";

export type PatientGovtIdentification = {
  patientGovtIdentificationType: PatientGovtIdentificationType;
  referenceDocument?: ReferenceDocument;
};

type ReferenceDocument = {
  id: string;
};

export type PatientGovtIdentificationType =
  | AadhaarCard
  | Passport
  | DrivingLicense
  | OtherGovtIdentification;

export type AadhaarCard = {
  type: "AADHAAR_CARD";
  aadhaarNumber: string;
};

export type Passport = {
  type: "PASSPORT";
  passportNumber: string;
};

export type DrivingLicense = {
  type: "DRIVING_LICENSE";
  drivingLicenseNumber: string;
};

export type OtherGovtIdentification = {
  type: "OTHER";
  otherGovtIdentificationName: string;
  otherGovtIdentificationNumber: string;
};

export type PaymentReference = { id: string };

export type PreConsultationAssignment = {
  [key in PreConsultationAssignmentTo]?: {
    preConsultationAssignementId: string;
    assignedTo: key | undefined;
    assignedUserId: string;
    assignedDate: Date;
    assignmentMode: Automatic | Manual;
  };
};

export type PreConsultationAssignmentTo = "MO";

export type Automatic = {
  assignedBy: "AUTOMATIC";
};

export type Manual = {
  assignedBy: "MANUAL";
  assignedByUserId: string;
};

export type PreConsultationReviewStatus = {
  reviewer: AdminRole | "MO";
  reviewerId: string;
  reviewStatus: Approved | Rejected;
  reviewDate: Date;
};

export type Approved = {
  status: "APPROVED";
};

export type Rejected = {
  status: "REJECTED";
  comments: string;
};

export type PreConsultationReminder = {
  [key in PreConsultationReminderType]?: {
    reminderId: string;
    createdDate: Date;
    reminderStatus: Pending | Sent | Cancelled;
    reminderDate: Date;
    reminderType: key | undefined;
  };
};

export type PreConsultationReminderType =
  | "SERVICE_SELECTION_REMINDER_FOR_PATIENT"
  | "SERVICE_SELECTION_REMINDER_FOR_CLIENT"
  | "COURIER_SAMPLE_SLIDES_REMINDER_FOR_PATIENT"
  | "COURIER_SAMPLE_SLIDES_REMINDER_FOR_CLIENT"
  | "MEDICAL_REPORTS_REMINDER_FOR_PATIENT"
  | "MEDICAL_REPORTS_REMINDER_FOR_CLIENT"
  | "GOVT_IDENTIFICATION_REMINDER_FOR_PATIENT"
  | "GOVT_IDENTIFICATION_REMINDER_FOR_CLIENT";

export type Pending = {
  status: "PENDING";
};

export type Sent = {
  status: "SENT";
};

export type Cancelled = {
  status: "CANCELLED";
  reminderCancelledDate: Date;
};

export type PreConsultationNotification = {
  [key in NotificationType["notificationType"]]?: {
    notificationId: string;
    notifiedDate: Date;
    notificationType: key;
  };
} & {
  [key in NotificationTypeWithRejection["notificationType"]]?: {
    notificationId: string;
    notifiedDate: Date;
    notificationType: key;
    notificationComment: string;
  };
};

export type NotificationType = {
  notificationType:
    | "MO_ASSIGNMENT_TO_HMT_AND_CMO"
    | "INQUIRY_APPROVAL_TO_CLIENT"
    | "PRICING_BROCHURE_TO_PATIENT"
    | "PHYSICIAN_PREFERENCE_TO_PMC"
    | "UPLOADED_REPORTS_TO_PMC"
    | "UPLOADED_PATIENT_GOVT_ID_TO_PMC"
    | "PATIENT_GOVT_ID_VERIFIED_TO_PMC"
    | "PATIENT_GOVT_ID_VERIFIED_TO_PATIENT"
    | "INQUIRY_APPROVED_BY_MO_TO_PATIENT"
    | "INQUIRY_APPROVED_BY_MO_TO_CLIENT"
    | "PRO_BONO_PAYMENT_TO_CLIENT"
    | "PRO_BONO_PAYMENT_APPROVED_TO_PATIENT"
    | "PRO_BONO_PAYMENT_APPROVED_TO_CLIENT"
    | "PRO_BONO_PAYMENT_APPROVED_TO_IRT"
    | "NOTIFICATION_SERVICE_TO_PATIENT"
    | "WIRE_TRANSFER_PAYMENT_TO_CLIENT"
    | "WIRE_TRANSFER_PAYMENT_TO_NEWYORK_TEAM"
    | "WIRE_TRANSFER_PAYMENT_APPROVED_TO_PATIENT"
    | "WIRE_TRANSFER_PAYMENT_APPROVED_TO_CLIENT"
    | "WIRE_TRANSFER_PAYMENT_APPROVED_TO_IRT"
    | "PAYMENT_GATEWAY_APPROVED_TO_PATIENT"
    | "PAYMENT_GATEWAY_APPROVED_TO_CLIENT"
    | "PAMENT_GATEWAY_APPROVED_TO_IRT";
};

export type NotificationTypeWithRejection = {
  notificationType:
    | "PATIENT_GOVT_ID_REJECTED_TO_PMC"
    | "PATIENT_GOVT_ID_REJECTED_TO_PATIENT"
    | "INQUIRY_REJECTED_BY_MO_TO_PATIENT"
    | "INQUIRY_REJECTED_BY_MO_TO_CLIENT"
    | "PRO_BONO_PAYMENT_REJECTED_TO_PATIENT"
    | "PRO_BONO_PAYMENT_REJECTED_TO_CLIENT"
    | "WIRE_TRANSFER_PAYMENT_REJECTED_TO_PATIENT"
    | "WIRE_TRANSFER_PAYMENT_REJECTED_TO_CLIENT"
    | "PAYMENT_GATEWAY_REJECTED_TO_PATIENT"
    | "PAYMENT_GATEWAY_REJECTED_TO_CLIENT";
  notificationComment: string;
};
