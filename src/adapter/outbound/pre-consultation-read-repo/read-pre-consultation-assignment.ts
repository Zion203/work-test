import { Result } from "true-myth";
import type { PreConsultationAssignment as PreConsultationAssignment } from "../../../core/application/command/assign-mo/assign-mo-handler.js";
import { query, type DataClient } from "@icliniqSmartDoctor/reactive-framework";
import { preConsultationPreConsultation } from "../collections.js";
import type {
  PreConsultationAssignmentError,
  PreConsultationAssignmentResponse,
  PreConsultationAssignmentUnknownError,
} from "../../../core/ports/pre-consultation-ports.js";

export const fetchPreConsultationAssignment = async (
  preConsultationAssignment: PreConsultationAssignment,
  dataClient: DataClient
): Promise<
  Result<PreConsultationAssignmentResponse[], PreConsultationAssignmentError>
> => {
  try {
    const queryFilters = createQueryFilters(preConsultationAssignment);
    const queryFields = ["inquiryId", "assignedUserId"];

    const queryResult = await query(dataClient, {
      collectionName: preConsultationPreConsultation,
      fieldsToGet: queryFields,
      filters: queryFilters,
    });

    if (queryResult.isErr) {
      return Result.err(queryResult.error);
    }

    return Result.ok(
      queryResult.value as unknown as PreConsultationAssignmentResponse[]
    );
  } catch (error) {
    const unknownError = preConsultationAssignmentUnknownError(error);
    return Result.err(unknownError);
  }
};

const createQueryFilters = (
  preConsultationAssignment: PreConsultationAssignment
) => ({
  additional: [
    {
      value: preConsultationAssignment.assignedTo,
      type: "_eq",
      field: "assignedTo",
    },
    {
      value: preConsultationAssignment.assignedUserIds
        .map((item) => item.id)
        .join(","),
      type: "_in",
      field: "assignedUserId",
    },
  ],
});

export const preConsultationAssignmentUnknownError = (
  error: unknown
): PreConsultationAssignmentUnknownError => {
  return {
    type: "IOError",
    error: {
      type: "PreConsultationAssignmentUnknownError",
      code: "PC-APP-ADP-PCAUE",
      description: "Error occurred while fetching unknown Error",
      data: error,
      systemError: new Error("Error occurred while fetching inquiry"),
    },
    subtype: "NotFound",
    severity: "HIGH",
  };
};
