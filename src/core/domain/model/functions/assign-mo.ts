import { Result } from "true-myth";
import type { PreConsultation } from "../types/pre-consultation-aggregate.js";
import {
  RoleName,
  type IAMServiceGateway,
  type IamUsersError,
  type UsersQuery,
} from "@icliniqSmartDoctor/compresecond-shared-kernel";
import { ulid } from "ulid";
import type { AssignMo } from "../../../application/command/assign-mo/assign-mo-command.js";
import type {
  DomainError,
  ErrorObject,
} from "@icliniqSmartDoctor/shared-kernel";
import type {
  AssignedUserIds,
  PreConsultationAssignment,
} from "../../../application/command/assign-mo/assign-mo-handler.js";
import type { MoAssigned } from "../../events/mo-assigned.js";
import type {
  PreConsultationReadRepository,
  PreConsultationAssignmentError,
  PreConsultationAssignmentResponse,
} from "../../../ports/pre-consultation-ports.js";

type moUser = {
  id: string;
};

export type AssignedUserInquiryCount = {
  userId: string;
  activeInquiryCount: number;
};

export type AssignMoError = MoAssignedError;

export const assignMo = async (
  assignMo: AssignMo,
  preConsultationReadRepository: PreConsultationReadRepository,
  iamSeviceGateway: IAMServiceGateway,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _aggregate: PreConsultation
): Promise<Result<MoAssigned, AssignMoError>> => {
  const moUserId = await getMoUserId(
    preConsultationReadRepository,
    iamSeviceGateway
  );

  if (moUserId.isErr) return Result.err(moUserId.error);

  const moAssigned: MoAssigned = {
    name: "MoAssigned",
    createdOn: new Date(),
    createdBy: moUserId.value,
    aggregateId: assignMo.aggregateId,
    aggregateName: "PreConsultation",
    aggregateVersion: assignMo.aggregateVersion,
    id: ulid(),
    workflowInstanceId: assignMo.workflowInstanceId,
    sourceCommand: {
      name: "AssignMoCommand",
      comments: assignMo.description!,
    },
    assignments: {
      MO: {
        preConsultationAssignementId: ulid(),
        assignedTo: "MO",
        assignedUserId: moUserId.value,
        assignedDate: new Date(),
        assignmentMode: {
          assignedBy: "AUTOMATIC",
        },
      },
    },
  };
  return Result.ok(moAssigned);
};

export const applyMoAssigned = async (
  oldPreConsultation: PreConsultation,
  event: MoAssigned
): Promise<PreConsultation> => {
  const preConsultation: PreConsultation = {
    ...oldPreConsultation,
    isNew: false,
    version: oldPreConsultation.version,
    versionComments: oldPreConsultation.versionComments,
    assignments: event.assignments,
    auditHistory: new Set([
      ...oldPreConsultation.auditHistory,
      {
        comments: event.sourceCommand.comments,
        version: oldPreConsultation.version,
        createdBy: event.createdBy,
        commandName: event.sourceCommand.name,
        timestamp: new Date(),
      },
    ]),
  };

  return preConsultation;
};

type MoAssignedError =
  | PreConsultationAssignmentError
  | UsersWithMinimalInquiriesNotFoundError
  | IamUsersError;

const getMoUserId = async (
  preConsultationReadRepository: PreConsultationReadRepository,
  iamSeviceGateway: IAMServiceGateway
): Promise<Result<string, MoAssignedError>> => {
  const iamUsersData: UsersQuery = {
    name: "users",
    roleName: RoleName.app_mo,
    aggregateName: "iam",
    id: "",
    aggregateId: "",
    createdBy: "",
    createdOn: new Date(),
  };
  const responseGetUsers = await iamSeviceGateway.getIamUsers(iamUsersData);

  if (responseGetUsers.isErr) return Result.err(responseGetUsers.error);

  const moUserIds: AssignedUserIds[] = responseGetUsers.value.users.map(
    (user) => ({ id: user.id })
  );

  const preConsultationAssignment: PreConsultationAssignment = {
    assignedTo: "MO",
    assignedUserIds: moUserIds,
  };

  const preConsultationAssigmentResponse =
    await preConsultationReadRepository.getPreConsultationAssignment(
      preConsultationAssignment
    );

  if (preConsultationAssigmentResponse.isErr)
    return Result.err(preConsultationAssigmentResponse.error);

  // const IrnsOfMo: IRNs = preConsultationAssigmentResponse.value.map(
  //   (preConsultation) => preConsultation.irn
  // );

  const newUsers = getUnassignedMoUsers(
    moUserIds,
    preConsultationAssigmentResponse.value
  );

  const isNewUser = newUsers.length > 0;

  if (isNewUser) return Result.ok(newUsers[0]!.id);

  /*const activeInquiriesResponse =
    await preConsultationReadRepository.getActiveInquiries(IrnsOfMo);

  if (activeInquiriesResponse.isErr)
    return Result.err(activeInquiriesResponse.error);

  const activeInquiryIRNs = activeInquiriesResponse.value.map(
    (inquiry) => inquiry.id
  );*/

  const activeInquiryIRNs: string[] = [];

  const usersWithMinimalInquiriesResponse = await findUsersWithMinimalInquiries(
    preConsultationAssigmentResponse.value,
    activeInquiryIRNs
  );

  if (usersWithMinimalInquiriesResponse.isErr)
    return Result.err(usersWithMinimalInquiriesResponse.error);

  const userId = usersWithMinimalInquiriesResponse.value[0]!.userId;
  return Result.ok(userId);
};

const getUnassignedMoUsers = (
  moUsers: moUser[],
  preConsultationAssignmentResponse: PreConsultationAssignmentResponse[]
): moUser[] => {
  const assignedUserIds = preConsultationAssignmentResponse.map(
    (preConsultation) => preConsultation.assignedUserId
  );
  const unAssignedUsers = moUsers.filter(
    (user) => !assignedUserIds.includes(user.id)
  );
  return unAssignedUsers;
};

const findUsersWithMinimalInquiries = async (
  preConsultationAssignmentResponse: PreConsultationAssignmentResponse[],
  activeInquiryIRNs: string[]
): Promise<
  Result<AssignedUserInquiryCount[], UsersWithMinimalInquiriesNotFoundError>
> => {
  const activeInquiryIrnSet = new Set(activeInquiryIRNs);
  const userAssignedInquiryIrnCountMap = new Map<string, number>();
  preConsultationAssignmentResponse.forEach(({ assignedUserId, irn }) => {
    if (activeInquiryIrnSet.has(irn)) {
      const currentCount =
        userAssignedInquiryIrnCountMap.get(assignedUserId) || 0;
      userAssignedInquiryIrnCountMap.set(assignedUserId, currentCount + 1);
    }
  });

  const userInquiryCount = Array.from(
    userAssignedInquiryIrnCountMap,
    ([userId, activeInquiryCount]) => ({
      userId,
      activeInquiryCount,
    })
  ).sort((a, b) => a.activeInquiryCount - b.activeInquiryCount);

  if (userInquiryCount.length === 0)
    return Result.err(usersWithMinimalInquiriesNotFoundError());

  return Result.ok(userInquiryCount);
};

type UsersWithMinimalInquiriesNotFoundError = DomainError<
  ErrorObject<"UsersWithMinimalInquiriesNotFoundError", "PC-DOM-UWMINFE">
>;

const usersWithMinimalInquiriesNotFoundError =
  (): UsersWithMinimalInquiriesNotFoundError => ({
    type: "DomainError",
    error: {
      type: "UsersWithMinimalInquiriesNotFoundError",
      code: "PC-DOM-UWMINFE",
      description: `Users with minimal inquiries not found.`,
      systemError: new Error(`users with minimal inquiries not found.`),
    },
    subType: "InvariantFailed",
    severity: "MEDIUM",
  });
