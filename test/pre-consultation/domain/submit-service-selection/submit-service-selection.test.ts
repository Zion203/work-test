import { describe, test, expect, vi } from "vitest";
import { SubmitServiceSelection } from "../../../../src/core/application/command/submit-service-selection/submit-service-selection-command.js";
import { submitServiceSelection } from "../../../../src/core/domain/model/functions/submit-service-selection.js";
import { ServiceSelectionSubmitted } from "../../../../src/core/domain/events/service-selection-submitted.js";
import { mockInquiryServiceGatewayForInquiryDetail } from "../../../fixtures.js";

vi.mock("ulid", () => ({
  ulid: vi.fn(() => "mockedUlid"),
}));

describe("submitServiceSelection", () => {
  test("should submitServiceSelection from command", async () => {
    const submitServiceSelectionCommand: SubmitServiceSelection = {
      id: "mockedUlid",
      name: "SubmitServiceSelection",
      aggregateId: "mockedUlid",
      aggregateName: "PreConsultation",
      description: "Test Service Selection Submission",
      aggregateVersion: 1,
      source: {
        type: "APP",
        userId: "User001",
      },
      retry: 1,
      createdBy: "12333",
      createdOn: expect.any(Date),
      workflowInstanceId: "testId",
      IRN: "IRN12345",
      inquiryId: "INQ98765",
      services: [
        {
          name: "VIDEO_CONSULTATION",
          preferredPhysicianName: "Dr. Smith",
          supplimentaryServices: [
            {
              name: "INTEGRATIVE_MEDICINE",
            },
          ],
          isMultiMdConsult: false,
        },
        {
          name: "PATHOLOGY_REVIEW",
          slideType: {
            type: "STAINED_SLIDES",
            pathologyType: {
              type: "STANDARD_PATHOLOGY",
              courierDetails: {
                courierType: "SELF_COURIER",
                trackingId: "12345",
                contactPersonName: "John Doe",
                contactPersonPhone: "1234567890",
              },
            },
          },
        },
      ],
    };

    const mockInquiryServiceGateway =
      mockInquiryServiceGatewayForInquiryDetail();

    const result = await submitServiceSelection(
      submitServiceSelectionCommand,
      mockInquiryServiceGateway
    );
    const serviceSelectionSubmitted: ServiceSelectionSubmitted = {
      id: "mockedUlid",
      aggregateId: "mockedUlid",
      aggregateName: "PreConsultation",
      aggregateVersion: 1,
      createdBy: "12333",
      createdOn: expect.any(Date),
      name: "ServiceSelectionSubmitted",
      workflowInstanceId: "testId",
      sourceCommand: {
        comments: "Test Service Selection Submission",
        name: "SubmitServiceSelection",
      },
      IRN: "IRN12345",
      inquiryId: "INQ98765",
      services: [
        {
          name: "VIDEO_CONSULTATION",
          preferredPhysicianName: "Dr. Smith",
          supplimentaryServices: [
            {
              name: "INTEGRATIVE_MEDICINE",
            },
          ],
          isMultiMdConsult: false,
        },
        {
          name: "PATHOLOGY_REVIEW",
          slideType: {
            type: "STAINED_SLIDES",
            pathologyType: {
              type: "STANDARD_PATHOLOGY",
              courierDetails: {
                courierType: "SELF_COURIER",
                trackingId: "12345",
                contactPersonName: "John Doe",
                contactPersonPhone: "1234567890",
              },
            },
          },
        },
      ],
    };
    expect(result.isOk).toEqual(true);
    if (result.isOk) {
      expect(result.value).toEqual(serviceSelectionSubmitted);
    }
  });
});
