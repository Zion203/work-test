
import { RoleName,  type IAMServiceGateway, type IamUsersError, type NotifyError, type UsersQuery } from "@icliniqSmartDoctor/compresecond-shared-kernel";
import { Result } from "true-myth";

import type {
    PreConsultationNotificationTemplateError,
    PreConsultationNotificationTemplateResponse,
    PreConsultationReadRepository,
  } from "../../../../ports/pre-consultation-ports.js";


export type AssembleNotificationDataResponse = string;
export type EmailIds = { email: string };
export type EmailIdsResult = { to: EmailIds[] };
export type CreateNotificationPayloadError =
  | PreConsultationNotificationTemplateError
  | NotifyError;

  export const retrieveNotificationTemplatesForPreConsultation = async (
    PreConsultationReadRepository: PreConsultationReadRepository,
    PreConsultationNotificationType: string
  ): Promise<
    Result<
      PreConsultationNotificationTemplateResponse[],
      PreConsultationNotificationTemplateError
    >
  > => {
    const PreConsultationNotificationTemplateResult =
      await PreConsultationReadRepository.getPreConsultationNotificationTemplate({
        notificationType: PreConsultationNotificationType,
      });
  
    if (PreConsultationNotificationTemplateResult.isErr) {
      return Result.err(PreConsultationNotificationTemplateResult.error);
    }
  
    return Result.ok(PreConsultationNotificationTemplateResult.value);
  };
  
  export const fetchEmailIdByMtUserId = async (
    iamSeviceGateway: IAMServiceGateway,
    userId: string
  ): Promise<Result<EmailIdsResult, IamUsersError>> => {
    const MTEmailResult = await fetchEmailsByRoleAndUserId(
      RoleName.app_mt,
      iamSeviceGateway,
      userId
    );
  
    if (MTEmailResult.isErr) {
      return Result.err(MTEmailResult.error);
    }
    const to = [...MTEmailResult.value];
    return Result.ok({ to });
  };
  
  export const fetchEmailsByRoleAndUserId = async (
    roleName: RoleName,
    iamSeviceGateway: IAMServiceGateway,
    userId: string
  ): Promise<Result<EmailIds[], IamUsersError>> => {
    const iamUsersData: UsersQuery = {
      name: "users",
      roleName: roleName,
      aggregateName: "iam",
      id: userId,
      createdOn: new Date(),
      createdBy: "",
      aggregateId: "",
    };
  
    const iamUserByRoleAndUserIdResponse = await iamSeviceGateway.getIamUsers(iamUsersData);
  
    if (iamUserByRoleAndUserIdResponse.isErr) {
      return Result.err(iamUserByRoleAndUserIdResponse.error);
    }
  
    return Result.ok(
      iamUserByRoleAndUserIdResponse.value.users.map((user) => ({ email: user.email }))
    );
  };