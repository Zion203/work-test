import type {
  PreConsultation,
  Service,
} from "../types/pre-consultation-aggregate.js";
import { Result } from "true-myth";
import type { SubmitServiceSelection } from "../../../application/command/submit-service-selection/submit-service-selection-command.js";
import { ulid } from "ulid";
import type { ServiceSelectionSubmitted } from "../../events/service-selection-submitted.js";
import type {
  InquiryResponseError,
  InquiryServiceGateway,
} from "@icliniqSmartDoctor/compresecond-shared-kernel";
import type {
  DomainError,
  ErrorObject,
} from "@icliniqSmartDoctor/shared-kernel";

type CannotSubmitServiceSelectionUnlessInquiryStatusIsActiveError = DomainError<
  ErrorObject<
    "CannotSubmitServiceSelectionUnlessInquiryStatusIsActiveError",
    "PC-DOM-CSSSUISIAE"
  >
>;

type ServiceCombinationNotAllowedError = DomainError<
  ErrorObject<"ServiceCombinationNotAllowedError", "PC-DOM-SCNAE">
>;

export type SubmitServiceSelectionError =
  | InquiryResponseError
  | CannotSubmitServiceSelectionUnlessInquiryStatusIsActiveError
  | ServiceCombinationNotAllowedError;

export const submitServiceSelection = async (
  submitServiceSelection: SubmitServiceSelection,
  inquirySeviceGateway: InquiryServiceGateway
): Promise<Result<ServiceSelectionSubmitted, SubmitServiceSelectionError>> => {
  const validateServiceCombinationResult = await validateServiceCombination(
    submitServiceSelection.services
  );

  if (validateServiceCombinationResult.isErr)
    return Result.err(validateServiceCombinationResult.error);

  const getInquiryDetailsQuery = {
    name: "getInquiryDetails",
    IRN: submitServiceSelection.IRN,
    aggregateName: "Inquiry",
    id: "",
    createdOn: new Date(),
    createdBy: "",
    aggregateId: submitServiceSelection.inquiryId,
  };

  const inquiryServiceGatewayResponse =
    await inquirySeviceGateway.getInquiryByIrn(getInquiryDetailsQuery);

  if (inquiryServiceGatewayResponse.isErr)
    return Result.err(inquiryServiceGatewayResponse.error);

  const inquiryResponseResult = await isInquiryActive(
    inquiryServiceGatewayResponse.value.inquiryOfIrn[0]?.inquiryStatus
  );

  if (inquiryResponseResult.isErr)
    return Result.err(inquiryResponseResult.error);

  const serviceSelectionSubmitted: ServiceSelectionSubmitted = {
    id: ulid(),
    aggregateId: ulid(),
    createdOn: new Date(),
    createdBy: submitServiceSelection.createdBy,
    aggregateName: "PreConsultation",
    aggregateVersion: submitServiceSelection.aggregateVersion,
    name: "ServiceSelectionSubmitted",
    sourceCommand: {
      name: submitServiceSelection.name,
      comments: submitServiceSelection.description!,
    },
    workflowInstanceId: submitServiceSelection.workflowInstanceId,
    IRN: submitServiceSelection.IRN,
    inquiryId: submitServiceSelection.inquiryId,
    services: submitServiceSelection.services,
  };

  return Result.ok(serviceSelectionSubmitted);
};

export const applyServiceSelectionSubmitted = async (
  event: ServiceSelectionSubmitted
): Promise<PreConsultation> => {
  const preConsultation: PreConsultation = {
    name: "PreConsultation",
    id: event.aggregateId,
    version: 0,
    versionComments: event.sourceCommand.comments,
    isNew: true,
    auditHistory: new Set([
      {
        comments: event.sourceCommand.comments,
        version: 1,
        createdBy: event.createdBy,
        commandName: event.sourceCommand.name,
        timestamp: event.createdOn!,
      },
    ]),
    IRN: event.IRN,
    inquiryId: event.inquiryId,
    services: event.services,
  };

  return preConsultation;
};

const isInquiryActive = async (
  inquiryStatus: string | undefined
): Promise<
  Result<boolean, CannotSubmitServiceSelectionUnlessInquiryStatusIsActiveError>
> => {
  if (inquiryStatus !== "ACTIVE") {
    const error: CannotSubmitServiceSelectionUnlessInquiryStatusIsActiveError =
      {
        type: "DomainError",
        error: {
          code: "PC-DOM-CSSSUISIAE",
          description: `Pre Consultation cannot be submitted because the inquiry status is ${inquiryStatus}.`,
          type: "CannotSubmitServiceSelectionUnlessInquiryStatusIsActiveError",
          systemError: new Error(
            `The inquiry status must be active to proceed.`
          ),
        },
        subType: "InvariantFailed",
        severity: "MEDIUM",
      };
    return Result.err(error);
  }
  return Result.ok(true);
};

const validateServiceCombination = async (
  services: Service[]
): Promise<Result<boolean, ServiceCombinationNotAllowedError>> => {
  const serviceNames = services.map((service) => service.name);

  if (
    (serviceNames.includes("TRAVEL_TO_MSK_NEW_YORK") &&
      serviceNames.length > 1) ||
    (serviceNames.includes("VIDEO_CONSULTATION") &&
      serviceNames.includes("WRITTEN_CONSULTATION"))
  ) {
    const error: ServiceCombinationNotAllowedError = {
      type: "DomainError",
      error: {
        code: "PC-DOM-SCNAE",
        description: `The selected services are not allowed together. Please check the service combinations.`,
        type: "ServiceCombinationNotAllowedError",
        systemError: new Error(
          `Validation failed due to incompatible service combinations.`
        ),
      },
      subType: "InvariantFailed",
      severity: "MEDIUM",
    };
    return Result.err(error);
  }

  return Result.ok(true);
};
