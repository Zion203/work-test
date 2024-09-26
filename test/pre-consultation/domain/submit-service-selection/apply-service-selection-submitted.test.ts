import { describe, test, expect, vi } from "vitest";
import { ServiceSelectionSubmitted } from "../../../../src/core/domain/events/service-selection-submitted";
import { applyServiceSelectionSubmitted } from "../../../../src/core/domain/model/functions/submit-service-selection";

describe("applyServiceSelectionSubmitted", () => {
  test("should applyServiceSelectionSubmitted", async () => {
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
    const result = await applyServiceSelectionSubmitted(
      serviceSelectionSubmitted
    );
    if (result) {
      expect(result).toEqual({
        id: "mockedUlid",
        auditHistory: new Set([
          {
            commandName: "SubmitServiceSelection",
            comments: "Test Service Selection Submission",
            createdBy: "12333",
            timestamp: expect.any(Date),
            version: 1,
          },
        ]),
        isNew: true,
        name: "PreConsultation",
        version: 0,
        versionComments: "Test Service Selection Submission",
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
      });
    }
  });
});
