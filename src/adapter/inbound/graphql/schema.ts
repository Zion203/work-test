import {
  GraphQLCommand,
  OutputTrace,
  GraphQLCommandResponse,
  ScalarTypes,
  GraphQLQuery
} from "@icliniqSmartDoctor/reactive-framework";
import gql from "graphql-tag";

export const typeDefs = gql.gql`
${ScalarTypes}

enum ServiceName {
  VIDEO_CONSULTATION
  WRITTEN_CONSULTATION
  RADIOLOGY_REVIEW
  PATHOLOGY_REVIEW
  TRAVEL_TO_MSK_NEW_YORK
}

enum SupplimentaryService {
  INTEGRATIVE_MEDICINE
  ONCOLOGY_PAIN_MANAGEMENT
}

enum SlideType {
  STAINED_SLIDES
  UNSTAINED_SLIDES
  PATHOLOGY_BLOCK
  UNSTAINED_SLIDES_AND_PATHOLOGY_BLOCK
  STAINED_SLIDES_AND_PATHOLOGY_BLOCK
  NONE
}

enum CourierType {
  SELF_COURIER
  PICK_UP_ASSISTANCE
}

enum CollectSpecimenFrom {
  LOCATION
  HOSPITAL
}

enum PathologyType {
  STANDARD_PATHOLOGY
  EXTENSIVE_PATHOLOGY
}

input CourierDetailsInput {
  courierType: CourierType
  trackingId: String
  contactPersonName: String
  contactPersonPhone: String
  collectSpecimenFrom: CollectSpecimenFrom
}

input PathologyTypeInput {
  type: PathologyType
  courierDetails: CourierDetailsInput
}

input SlideTypeInput {
  type: SlideType
  pathologyType: PathologyTypeInput
}

input SupplimentaryServiceInput {
  name: SupplimentaryService
}

input ServiceInput {
  name: ServiceName!
  preferredPhysicianName: String
  supplimentaryServices: [SupplimentaryServiceInput]
  isMultiMdConsult: Boolean
  slideType: SlideTypeInput
}

input SubmitServiceSelection {
  ${GraphQLCommand}!
  IRN: String!
  inquiryId: String!
  services: [ServiceInput]!
}

${OutputTrace}

type CommandResponse {
  ${GraphQLCommandResponse}
}

input ServiceDetails {
  ${GraphQLQuery}
 IRN: String
}

input ServiceListQuery {
  ${GraphQLQuery}
  inquiryId: [String]
}

type ServiceDetailsQueryResponse {
  id: String
  services: [String]
  preferredPhysicianName: String
  isMultiMdConsult: Boolean
}

type ServiceListQueryResponse {
  id: String
  inquiryId: String
  primaryConsultationService: String
}

type medicalReportResponse {
  id: String
  reportCategory: String
  reportType: String
  reportDescription: String
  reportTakenDate: String
  reportStatus: String
  referenceDocumentId: String
}

type govermentIdDetailsResponse {
id: String
identificationType: String
identificationNumber: String
otherIdentificationName: String
identificationStatus: String
referenceDocumentId: String
}

input medicalReportQuery {
  ${GraphQLQuery}
  IRN: String!
}

input govermentIdDetailsQuery {
  ${GraphQLQuery}
  IRN: String!
}

input notifyPatientWhenChooseService {
  ${GraphQLQuery}
  IRN: String!
}

type Query {
  serviceDetails(query: ServiceDetails): [ServiceDetailsQueryResponse]
  serviceList(query: ServiceListQuery): [ServiceListQueryResponse]
  medicalReportDetails(query: medicalReportQuery): [medicalReportResponse]
  govermentIdDetails(query: govermentIdDetailsQuery): [govermentIdDetailsResponse]
}

type Mutation {
  submitServiceSelection(command: SubmitServiceSelection): CommandResponse
  notifyPatientWhenChooseService(command : notifyPatientWhenChooseService!) : CommandResponse
}
`;
