import {
  type ApplicationContext,
  commandHandlerSimple,
  idempotencyCheckers,
  type CommandParams,
  type UserAuthorizor,
  newUserLevelAuthorizationFailedError,
} from "@icliniqSmartDoctor/reactive-framework";
import {
  domainToDataMapper,
  dataToDomainMapper,
  schema,
} from "../../../../adapter/outbound/pre-consultation-repo.js";
import type { PreConsultation } from "../../../domain/model/types/pre-consultation-aggregate.js";
import type { ReAssignMo } from "./re-assign-mo-command.js";
import {
  applyMoReAssigned,
  reAssignMo,
} from "../../../domain/model/functions/re-assign-mo.js";
import { z } from "zod";
import { Result } from "true-myth";
import type { ManagedError } from "@icliniqSmartDoctor/shared-kernel";
import { RoleName } from "@icliniqSmartDoctor/compresecond-shared-kernel";
import type { MoReAssigned } from "../../../domain/events/mo-re-assigned.js";

const commandValidationSchema = z.object({
  moUserId: z.string(),
});

const getCommandParams = (
  applicationContext: ApplicationContext,
  command: ReAssignMo
): CommandParams<PreConsultation, ReAssignMo, MoReAssigned> => {
  const userAuthorizor: UserAuthorizor<ReAssignMo, PreConsultation> = async (
    cmd
  ) => {
    return canUserReassignMo(
      cmd.source.userId,
      applicationContext.user.roleName
    );
  };

  return {
    idempotencyChecker: idempotencyCheckers.inHerentlyIdempotent(),
    // do it right your code is wrong, so i put some authorizer temp, talk to abdul, please think logically ,
    userAuthorizor: userAuthorizor,
    operation: {
      onAggregate: {
        aggregateId: command.aggregateId,
        eventCreator: reAssignMo,
        aggregateMutator: applyMoReAssigned,
      },
    },
    domainToDataMapper,
    dataToDomainMapper,

    boundedContext: "PreConsultation",
    dataSchema: schema,
  };
};

export const reAssignMoHandler = commandHandlerSimple(
  commandValidationSchema,
  getCommandParams
);

export const canUserReassignMo = (
  userId: string,
  roleName: string
): Result<
  {
    isAuthorized: boolean;
    userId: string;
  },
  ManagedError
> => {
  const userRoleName = roleName.toUpperCase();

  if (
    userRoleName === RoleName.app_cmo.toUpperCase() ||
    userRoleName === RoleName.app_hmt.toUpperCase()
  ) {
    return Result.ok({ isAuthorized: true, userId });
  }

  return Result.err(
    newUserLevelAuthorizationFailedError(
      `${userRoleName} is not allowed to Reassign MO`,
      `This command is supposed to be invoked only by the ${RoleName.app_cmo.toUpperCase()} & ${RoleName.app_hmt.toUpperCase()}.`
    )
  );
};
