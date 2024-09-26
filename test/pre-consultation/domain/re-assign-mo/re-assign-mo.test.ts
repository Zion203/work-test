import { expect, it, describe } from "vitest";
import { reAssignMo } from "../../../../src/core/domain/model/functions/re-assign-mo.js";
import { ReAssignMo } from "../../../../src/core/application/command/re-assign-mo/re-assign-mo-command.js";
import { aggregate } from "../../../fixtures.js";
import { MoReAssigned } from "../../../../src/core/domain/events/mo-re-assigned.js";

describe("MoReAssigned", () => {
  it("Mo Re Assigned", async () => {
    const expectedEvent: MoReAssigned = {
      name: "MoReAssigned",
      id: expect.any(String),
      createdOn: expect.any(Date),
      aggregateId: "AGG001",
      aggregateName: "PreConsultation",
      createdBy: "1234",
      aggregateVersion: 1,
      sourceCommand: {
        name: "ReAssignMoCommand",
        comments: "comments",
      },
      workflowInstanceId: "workflowId",
      assignments: {
        MO: {
          preConsultationAssignementId: expect.any(String),
          assignedTo: "MO",
          assignedUserId: "1234",
          assignedDate: expect.any(Date),
          assignmentMode: {
            assignedBy: "MANUAL",
            assignedByUserId: "1234",
          },
        },
      },
    };

    const testCommand: ReAssignMo = {
      description: "comments",
      moUserId: "1234",
      aggregateName: "PreConsultation",
      name: "ReAssignMo",
      id: "1234",
      workflowInstanceId: "workflowId",
      aggregateVersion: 1,
      retry: 1,
      source: {
        type: "APP",
        userId: "1234",
      },
      createdOn: new Date(),
      createdBy: "1234",
      aggregateId: "AGG001",
    };

    const result = await reAssignMo(testCommand, aggregate);

    expect(result.isOk).toBe(true);
    expect(result.unwrapOr(expectedEvent)).toEqual(expectedEvent);
  });
});
