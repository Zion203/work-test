import {
  dataToDomainMapper,
  domainToDataMapper,
  schema,
} from "../../../../adapter/outbound/pre-consultation-repo.js";

import {
  type ApplicationContext,
  authorizers,
  commandHandlerSimple,
  type CommandParams,
  idempotencyCheckers,
} from "@icliniqSmartDoctor/reactive-framework";

import { preConsultationReadRepo } from "../../../../adapter/outbound/pre-consultation-read-repo/index.js";
import { type NotifyPatientWhenChooseServiceCommand } from "./notify-patient-when-choose-service-command.js";

import { Result } from "true-myth";

import type { NotifyPatientWhenChooseService } from "../../../domain/events/notify-patient-when-choose-service.js"
import type { PreConsultation } from "../../../domain/model/types/pre-consultation-aggregate.js";
import { z } from "zod";

import {
  inquiryServiceGateway,
  notificationServiceGateway,
} from "@icliniqSmartDoctor/compresecond-shared-kernel";

import {
  applyPatientNotifiedAboutPreConsultation,
  notifyPatientAboutPreConsultation,
  type NotifyPatientAboutPreConsultationError,
} from "../../../domain/model/functions/notify-patient-when-choose-service.js";

export type PreConsultationNotificationType = {
  notificationType: string;
};

const commandValidationSchema = z
  .object({
    IRN: z.string(),
  })
  .required();

const getCommandParams = (
  applicationContext: ApplicationContext,
  command: NotifyPatientWhenChooseServiceCommand
): CommandParams<
  PreConsultation,
  NotifyPatientWhenChooseServiceCommand,
  NotifyPatientWhenChooseService
> => {
  return {
    idempotencyChecker: idempotencyCheckers.inHerentlyIdempotent(),
    userAuthorizor: authorizers.workflowOnlyAuthorizer(),
    operation: {
      onAggregate: {
        aggregateId: command.aggregateId,
        eventCreator: async (
          command: NotifyPatientWhenChooseServiceCommand,
          aggregate: PreConsultation
        ): Promise<
          Result<
          NotifyPatientWhenChooseService,
            NotifyPatientAboutPreConsultationError
          >
        > => {
          const notifyServiceGateway =
            notificationServiceGateway(applicationContext);
          const PreConsultationReadRespository = preConsultationReadRepo(
            applicationContext.dataClient
          );
          const inquirySeviceGateway =
            inquiryServiceGateway(applicationContext);
          return notifyPatientAboutPreConsultation(
            command,
            aggregate,
            notifyServiceGateway,
            PreConsultationReadRespository,
            inquirySeviceGateway
          );
        },
        aggregateMutator: applyPatientNotifiedAboutPreConsultation,
      },
    },
    domainToDataMapper,
    dataToDomainMapper,
    boundedContext: "PreConsultation",
    dataSchema: schema,
  };
};

export const notifyPatientAboutPreConsultationApprovalHandler =
  commandHandlerSimple(commandValidationSchema, getCommandParams);
