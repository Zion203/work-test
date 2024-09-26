import {
  dataToDomainMapper,
  domainToDataMapper,
  schema,
} from "../../../../adapter/outbound/pre-consultation-repo.js";
import {
  type ApplicationContext,
  commandHandlerSimple,
  type CommandParams,
  type IdempotencyChecker,
  newUserLevelAuthorizationFailedError,
  type UserAuthorizor,
} from "@icliniqSmartDoctor/reactive-framework";
import { type PreConsultation } from "../../../domain/model/types/pre-consultation-aggregate.js";
import { type SubmitServiceSelection } from "./submit-service-selection-command.js";
import {
  applyServiceSelectionSubmitted,
  submitServiceSelection,
  type SubmitServiceSelectionError,
} from "../../../domain/model/functions/submit-service-selection.js";
import { Result } from "true-myth";
import { commandValidationSchema } from "./submit-service-selection-validation.js";
import type { ServiceSelectionSubmitted } from "../../../domain/events/service-selection-submitted.js";
import { preConsultationReadRepo } from "../../../../adapter/outbound/pre-consultation-read-repo/index.js";
import {
  inquiryServiceGateway,
  RoleName,
} from "@icliniqSmartDoctor/compresecond-shared-kernel";
import type { ManagedError } from "@icliniqSmartDoctor/shared-kernel";

const getCommandParams = (
  applicationContext: ApplicationContext,
  command: SubmitServiceSelection
): CommandParams<
  PreConsultation,
  SubmitServiceSelection,
  ServiceSelectionSubmitted
> => {
  const inquirySeviceGateway = inquiryServiceGateway(applicationContext);

  const idempotencyChecker: IdempotencyChecker<
    SubmitServiceSelection,
    PreConsultation
    // eslint-disable-next-line
  > = async (_cmd, _agg) => {
    const PreConsultationReadRepository = preConsultationReadRepo(
      applicationContext.dataClient
    );
    const preConsultationyResult =
      await PreConsultationReadRepository.getPreConsultationByIrn(command.IRN);

    if (preConsultationyResult.isErr) {
      return Result.err(preConsultationyResult.error);
    }

    return preConsultationyResult.value &&
      preConsultationyResult.value.length > 0
      ? Result.ok({ isSuccess: false })
      : Result.ok({ isSuccess: true });
  };

  const userAuthorizor: UserAuthorizor<
    SubmitServiceSelection,
    PreConsultation
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  > = async (cmd, _agg) => {
    switch (applicationContext.user.roleName) {
      case RoleName.app_client: {
        const inquiryData = {
          name: "getInquiryDetails",
          IRN: cmd.IRN,
          aggregateName: "Inquiry",
          id: "",
          createdOn: new Date(),
          createdBy: cmd.source.userId,
          aggregateId: cmd.inquiryId,
        };

        const inquiryResponse = await inquirySeviceGateway.getInquiryByIrn(
          inquiryData
        );

        if (inquiryResponse.isErr) {
          return Result.err(inquiryResponse.error);
        }

        const creatorType = inquiryResponse.value.inquiryOfIrn[0]?.creatorType;
        const creatorUserId =
          inquiryResponse.value.inquiryOfIrn[0]?.creatorUserId;
        const patientUserId =
          inquiryResponse.value.inquiryOfIrn[0]?.patientUserId;

        return creatorType === "CARE_GIVER"
          ? canServiceSelectionBeSubmittedByUser(
              command.source.userId,
              applicationContext.user.roleName,
              creatorUserId!
            )
          : canServiceSelectionBeSubmittedByUser(
              command.source.userId,
              applicationContext.user.roleName,
              patientUserId!
            );
      }
      default: {
        const preConsultationData = {
          name: "assignedUsersOfInquiry",
          IRN: cmd.IRN,
          aggregateName: "Inquiry",
          id: "",
          createdOn: new Date(),
          createdBy: cmd.source.userId,
          aggregateId: cmd.inquiryId,
        };

        const assignedUsersResponse =
          await inquirySeviceGateway.getAssignedUsers(preConsultationData);

        if (assignedUsersResponse.isErr) {
          return Result.err(assignedUsersResponse.error);
        }

        const clientUser = assignedUsersResponse.value.assignedUsers.filter(
          (user) =>
            user.assignedTo.toLowerCase() === RoleName.app_pmc.toLowerCase()
        );

        const assignedUserId = clientUser[0]?.assignedUserId;

        return cmd.source.type === "WORKFLOW"
          ? Result.ok({ isAuthorized: true, userId: "WORKFLOW" })
          : canServiceSelectionBeSubmittedByUser(
              command.source.userId,
              applicationContext.user.roleName,
              assignedUserId!
            );
      }
    }
  };

  return {
    idempotencyChecker: idempotencyChecker,
    userAuthorizor: userAuthorizor,
    operation: {
      newAggregate: {
        eventCreator: async (
          command: SubmitServiceSelection
        ): Promise<
          Result<ServiceSelectionSubmitted, SubmitServiceSelectionError>
        > => {
          return submitServiceSelection(command, inquirySeviceGateway);
        },
        aggregateCreator: applyServiceSelectionSubmitted,
      },
    },
    domainToDataMapper,
    dataToDomainMapper,
    boundedContext: "PreConsultation",
    dataSchema: schema,
  };
};

export const submitServiceSelectionHandler = commandHandlerSimple(
  commandValidationSchema,
  getCommandParams
);

export const canServiceSelectionBeSubmittedByUser = (
  userId: string,
  roleName: string,
  assignedUserId: string
): Result<
  {
    isAuthorized: boolean;
    userId: string;
  },
  ManagedError
> => {
  const userRoleName = roleName.toUpperCase();
  if (
    (userRoleName === RoleName.app_pmc.toUpperCase() &&
      userId === assignedUserId) ||
    (userRoleName === RoleName.app_client.toUpperCase() &&
      userId === assignedUserId)
  ) {
    return Result.ok({ isAuthorized: true, userId });
  }

  if (
    userRoleName === RoleName.app_cmo.toUpperCase() ||
    userRoleName === RoleName.app_hmt.toUpperCase()
  ) {
    return Result.ok({ isAuthorized: true, userId });
  }

  return Result.err(
    newUserLevelAuthorizationFailedError(
      `PMC or Client ${assignedUserId} should not be invoked by ${userId}`,
      "This command is supposed to be invoked only by the PMC or Client to which the inquiry is assigned."
    )
  );
};
