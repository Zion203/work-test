import type { PreConsultation } from "../types/pre-consultation-aggregate.js";
import type { ReAssignMo } from "../../../application/command/re-assign-mo/re-assign-mo-command.js";
import { ulid } from "ulid";
import { Result } from "true-myth";
import type { MoReAssigned } from "../../events/mo-re-assigned.js";
import { getDataClient } from "@icliniqSmartDoctor/reactive-framework";
import {
  dataClientUrl,
  projectNumber,
} from "@icliniqSmartDoctor/compresecond-shared-kernel";
import { preConsultationAssignment } from "../../../../adapter/outbound/collections.js";

export type ReassignMoEventError = never;

export const reAssignMo = async (
  reAssignMo: ReAssignMo,
  _aggregate: PreConsultation
): Promise<Result<MoReAssigned, ReassignMoEventError>> => {
  if (_aggregate?.assignments?.MO) {
    await deleteAssignment(_aggregate?.IRN, _aggregate?.assignments);
  }

  const moReAssigned: MoReAssigned = {
    name: "MoReAssigned",
    id: ulid(),
    aggregateId: reAssignMo.aggregateId,
    aggregateName: "PreConsultation",
    aggregateVersion: reAssignMo.aggregateVersion,
    workflowInstanceId: reAssignMo.workflowInstanceId,
    createdOn: reAssignMo.createdOn!,
    createdBy: reAssignMo.createdBy,
    assignments: {
      MO: {
        assignedTo: "MO",
        assignedUserId: reAssignMo.moUserId,
        assignedDate: new Date(),
        assignmentMode: {
          assignedBy: "MANUAL",
          assignedByUserId: reAssignMo.createdBy,
        },
        preConsultationAssignementId: ulid(),
      },
    },
    sourceCommand: {
      name: "ReAssignMoCommand",
      comments: reAssignMo.description!,
    },
  };

  return Result.ok(moReAssigned);
};

export const applyMoReAssigned = async (
  oldPreConsultation: PreConsultation,
  event: MoReAssigned
): Promise<PreConsultation> => {
  const preConsultation: PreConsultation = {
    ...oldPreConsultation,
    isNew: false,
    id: event.aggregateId,
    versionComments: event.sourceCommand.comments,
    assignments: event.assignments,
    auditHistory: new Set([
      ...oldPreConsultation.auditHistory,
      {
        comments: event.sourceCommand.comments,
        version: oldPreConsultation.version,
        createdBy: event.createdBy,
        commandName: event.sourceCommand.name,
        timestamp: event.createdOn!,
      },
    ]),
  };
  return preConsultation;
};

const deleteAssignment = async (
  irn: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  assignment: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<Record<string, any>> => {
  const getQuery = `query PreConsultationAssignment {
    ${preConsultationAssignment}(
      filter: {
        IRN: { _eq: "${irn}" }
        assignedUserId: { _eq: "${assignment.MO?.assignedUserId}" }
        assignedTo: { _eq: "MO" }
      }
    ) {
      id
      dateCreated
      dateUpdated
      inquiryId
      assignedTo
      assignedUserId
      assignedDate
      assignmentMode
      assignedByUserId
      aggregateId
      aggregateName
      IRN
    }
  }`;

  // need to discuss
  const correlationId = "test";
  const directusClient = await getDataClient(
    correlationId,
    projectNumber(),
    dataClientUrl(),
    "DIRECTUS_SERVICE_ACCOUNT_PRE_CONSULTATION_ACCESS"
  );

  if (directusClient.isErr) {
    throw new Error(directusClient.error.error.description);
  }

  if (directusClient.isOk) {
    const directusResponse = await directusClient.value.query(getQuery);
    const deleteQuery = `mutation Delete_preConsultation_preConsultation_assignment_item {
        delete_preConsultation_preConsultation_assignment_item(id: "${directusResponse["preConsultation_preConsultation_assignment"][0].id}") {
            id
        }
    }`;
    const directusDeletionResponse = await directusClient.value.query(
      deleteQuery
    );
    return directusDeletionResponse[
      "delete_preConsultation_preConsultation_assignment_item"
    ];
  }

  throw new Error("Unexpected state: directusClient is neither Err nor Ok.");
};
