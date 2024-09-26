import type { PreConsultation } from "../types/pre-consultation-aggregate.js";
import { Result } from "true-myth";

import {
    BuildEmailNotificationCommand,
    type InquiryServiceGateway,
    type NotificationParams,
    type NotificationServiceGateway,
    type NotifyError,
    type NotifyResponse,
  } from "@icliniqSmartDoctor/compresecond-shared-kernel";
import type{
  PreConsultationNotificationTemplateResponse,
  PreConsultationReadRepository,
  NotificationKeys,
} from "../../../ports/pre-consultation-ports.js";
import type { NotifyPatientWhenChooseService } from "../../events/notify-patient-when-choose-service.js";
import type {  NotifyPatientWhenChooseServiceCommand} from "../../../application/command/notify-patient-when-choose-service/notify-patient-when-choose-service-command.js";

import {
    retrieveNotificationTemplatesForPreConsultation,
    type AssembleNotificationDataResponse,
    type CreateNotificationPayloadError,
  } from "./util/pre-consultation-notfication.js";


// ===================================================================================================================================
  const assembleNotificationData = async (
    aggregate: PreConsultation,
    command: NotifyPatientWhenChooseServiceCommand,
    PreConsultationReadRepository: PreConsultationReadRepository,
    notifyServiceGateway: NotificationServiceGateway,
    PreConsultationNotificationType: string,
    inquirySeviceGateway: InquiryServiceGateway
  ): Promise<
    Result<AssembleNotificationDataResponse, CreateNotificationPayloadError>
  > => {
    const inquiryData = {
      name: "getInquiryDetails",
      IRN: command.IRN,
      aggregateName: "Inquiry",
      id: "",
      createdOn: new Date(),
      createdBy: "",
      aggregateId: "",
    };
    const inquiryResponse = await inquirySeviceGateway.getInquiryByIrn(
        inquiryData
      );
      if (inquiryResponse.isErr) return Result.err(inquiryResponse.error);
    
      const patientEmail =
        inquiryResponse.value.inquiryOfIrn[0]?.patientPrimaryEmail;
    
      const PreConsultationNotificationTemplateResult =
        await retrieveNotificationTemplatesForPreConsultation(
          PreConsultationReadRepository,
          PreConsultationNotificationType
        );
    
      if (PreConsultationNotificationTemplateResult.isErr) {
        return Result.err(PreConsultationNotificationTemplateResult.error);
      }
      const PreConsultationTemplates: PreConsultationNotificationTemplateResponse[] =
        PreConsultationNotificationTemplateResult.value;
      const PreConsultationNotificationTemplate = PreConsultationTemplates[0]!;
    
      const buildNotificationResponse = await createNotificationPayload(
        PreConsultationNotificationType,
        aggregate,
        command,
        PreConsultationNotificationTemplate,
        notifyServiceGateway,
        "notify patient about case history approval",
        patientEmail!
      );
    
      if (buildNotificationResponse.isErr) {
        return Result.err(buildNotificationResponse.error);
      }
    
      return Result.ok(buildNotificationResponse.value.aggregateId);
    };

    //==================================================================================================================================

  export const notifyPatientAboutPreConsultation = async (
    notifyPatientAboutPreConsultation: NotifyPatientWhenChooseServiceCommand,
    aggregate: PreConsultation,
    notifyServiceGateway: NotificationServiceGateway,
    PreConsultationReadRespository: PreConsultationReadRepository,
    inquirySeviceGateway: InquiryServiceGateway
  ): Promise<
    Result<
    NotifyPatientWhenChooseService,
      NotifyPatientAboutPreConsultationError
    >
  > => {
    const PreConsultationNotificationType = "NOTIFICATION_SERVICE_TO_PATIENT";
    const assembleNotificationDataResponse = await assembleNotificationData(
      aggregate,
      notifyPatientAboutPreConsultation,
      PreConsultationReadRespository,
      notifyServiceGateway,
      PreConsultationNotificationType,
      inquirySeviceGateway
    );
    if (assembleNotificationDataResponse.isErr) {
      return Result.err(assembleNotificationDataResponse.error);
    }
    const patientNotifiedAboutPreConsultation: NotifyPatientWhenChooseService =
      {
        id: notifyPatientAboutPreConsultation.id,
        name: "NotifyPatientWhenChooseService",
        createdOn: new Date(),
        createdBy: notifyPatientAboutPreConsultation.createdBy,
        aggregateId: notifyPatientAboutPreConsultation.aggregateId,
        aggregateName: "PreConsultation",
        workflowInstanceId:
        notifyPatientAboutPreConsultation.workflowInstanceId,
        aggregateVersion: notifyPatientAboutPreConsultation.aggregateVersion,
        sourceCommand: {
          name: "NotifyPatientAboutPreConsultation",
          comments: notifyPatientAboutPreConsultation.description!,
        },
        PreConsultationNotification: {
          NOTIFICATION_SERVICE_TO_PATIENT: {
            notificationId: assembleNotificationDataResponse.value,
            notificationType: PreConsultationNotificationType,
            notifiedDate: new Date()
          }
        }
      };
    return Result.ok(patientNotifiedAboutPreConsultation);
  };

// ---------------------------------------------------------------------------------------------------------------------

  const createNotificationPayload = async (
    PreConsultationNotificationType: string,
    aggregate: PreConsultation,
    command: NotifyPatientWhenChooseServiceCommand,
    PreConsultationNotificationTemplate: PreConsultationNotificationTemplateResponse,
    notifyServiceGateway: NotificationServiceGateway,
    description: string,
    patientEmail: string,
  ): Promise<Result<NotifyResponse, NotifyError>> => {
    const currentDate = new Date();
    const daysToAdd = PreConsultationNotificationTemplate.daySchedule;
    const onNotificationDate = new Date(
      currentDate.getTime() + daysToAdd * 24 * 60 * 60 * 1000
    );
    const notificationParams: NotificationParams = {
      createdBy: command.createdBy,
      workflowInstanceId: command.workflowInstanceId,
      description: description,
      to: [
        {
          email: patientEmail,
        },
      ],
      template: {
        subject: PreConsultationNotificationTemplate.notificationSubject,
        body: PreConsultationNotificationTemplate.notificationTemplate,
      },
      variables: generateStaticNotificationVariables(
        aggregate,
        PreConsultationNotificationTemplate.notificationKeys
      ),
      belongsTo: {
        type: PreConsultationNotificationType,
        aggregateName: aggregate.name,
        aggregateId: command.aggregateId,
        workflowInstanceId: command.workflowInstanceId,
        data: {},
        userId: command.createdBy,
      },
      date: onNotificationDate,
    };
  
    const notificationCommand = BuildEmailNotificationCommand(notificationParams);
    const notificationResponse = await notifyServiceGateway.notification(
      notificationCommand
    );
  
    if (notificationResponse.isErr) return Result.err(notificationResponse.error);
  
    return Result.ok(notificationResponse.value);
  };
  

//------------------------------------------------------------------------------------------------------------------------------------


const generateStaticNotificationVariables = (
    aggregate: PreConsultation,
    notificationKeys: NotificationKeys
  ) => {
    const notificationKeysPreConsultationList = notificationKeys.PreConsultation ?? [];
  
    const PreConsultationVariables = notificationKeysPreConsultationList.map((key) => ({
      variableType: "STATIC",
      staticVariable: {
        key: `{PreConsultation.${key}}`,
        value: aggregate[key] ?? "",
      },
    }));
  
    return [...PreConsultationVariables];
  };

//------------------------------------------------------------------------------------------------------------------------------------

export type NotifyPatientAboutPreConsultationError = CreateNotificationPayloadError;


//--------------------------------------------------------------------------------------------------------------------------------------

export const applyPatientNotifiedAboutPreConsultation = async (
    oldPreConsultation: PreConsultation,
    event: NotifyPatientWhenChooseService
  ): Promise<PreConsultation> => {
    const PreConsultation: PreConsultation = {
      ...oldPreConsultation,
      isNew: false,
      version: oldPreConsultation.version,
      preConsultationNotifications: event.PreConsultationNotification,
      versionComments: event.sourceCommand.comments,
      auditHistory: new Set([
        ...oldPreConsultation.auditHistory,
        {
          comments: event.sourceCommand.comments,
          version: oldPreConsultation.version,
          createdBy: event.createdBy,
          commandName: event.sourceCommand.name,
          timestamp: new Date(),
        },
      ])
    };
    return PreConsultation;
  };