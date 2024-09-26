import {
  type ApplicationContext,
  commandHandlerSimple,
  idempotencyCheckers,
  authorizers,
  type CommandParams,
} from "@icliniqSmartDoctor/reactive-framework";
import { iamServiceGateway } from "@icliniqSmartDoctor/compresecond-shared-kernel";
import { Result } from "true-myth";
import {
  domainToDataMapper,
  dataToDomainMapper,
  schema,
} from "../../../../adapter/outbound/pre-consultation-repo.js";
import type { PreConsultation } from "../../../domain/model/types/pre-consultation-aggregate.js";
import {
  applyMoAssigned,
  assignMo,
  type AssignMoError,
} from "../../../domain/model/functions/assign-mo.js";
import { type AssignMo } from "./assign-mo-command.js";
import { preConsultationReadRepo } from "../../../../adapter/outbound/pre-consultation-read-repo/index.js";
import { z } from "zod";
import type { MoAssigned } from "../../../domain/events/mo-assigned.js";

export type AssignedUserIds = { id: string };
export type PreConsultationAssignment = {
  assignedTo: string;
  assignedUserIds: AssignedUserIds[];
};
export type IRNs = string[];

const commandValidationSchema = z.object({});

const getCommandParams = (
  applicationContext: ApplicationContext,
  command: AssignMo
): CommandParams<PreConsultation, AssignMo, MoAssigned> => {
  return {
    idempotencyChecker: idempotencyCheckers.inHerentlyIdempotent(),
    userAuthorizor: authorizers.workflowOnlyAuthorizer(),
    operation: {
      onAggregate: {
        aggregateId: command.aggregateId,

        eventCreator: async (
          command: AssignMo,
          _aggregate: PreConsultation
        ): Promise<Result<MoAssigned, AssignMoError>> => {
          const preConsultationReadRepository = preConsultationReadRepo(
            applicationContext.dataClient
          );
          const iamSeviceGateway = iamServiceGateway(applicationContext);
          return assignMo(
            command,
            preConsultationReadRepository,
            iamSeviceGateway,
            _aggregate
          );
        },
        aggregateMutator: async (
          aggregate: PreConsultation,
          event: MoAssigned
        ): Promise<PreConsultation> => {
          return applyMoAssigned(aggregate, event);
        },
      },
    },
    domainToDataMapper,
    dataToDomainMapper,

    boundedContext: "PreConsultation",
    dataSchema: schema,
  };
};

export const assignPmcToInquiryHandler = commandHandlerSimple(
  commandValidationSchema,
  getCommandParams
);
