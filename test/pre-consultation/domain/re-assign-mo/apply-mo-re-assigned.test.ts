import {  describe, it, expect } from "vitest";
import {  applyPmcReAssignedToInquiry } from "../../../../src/core/domain/model/functions/re-assign-pmc-for-inquiry";
import { Inquiry } from "../../../../src/core/domain/model/types/inquriy-aggregate";
import { PmcReAssignedToInquiry } from "../../../../src/core/domain/events/pmc-re-assigned-to-inquiry";

describe("PMC Re-Assign To Inquiry", () => {
    it("should Approve Pmc for Inquiry Approve", async () => {
        const inquiry: Inquiry = {
            IRN: "IRN",
            firstName: "firstName",
            lastName: "lastName",
            gender: "MALE",
            genderAtBirth: "MALE",
            dateOfBirth: new Date(),
            citizenship: "AFGHAN",
            patientPrimaryEmail: "patientPrimaryEmail",
            patientPrimaryPhone: "patientPrimaryPhone",
            preferredContactType: {
              contactType: "EMAIL",
            },
            address: {
              street: "street",
              city: "city",
              country: "AFGHANISTAN",
              postalCode: "postalcode",
              state: "state",
            },
            diagnosisStatus: "NEWLY_DIAGNOSED",
            typeOfAssistance: "TRAVEL_TO_MSK_NEW_YORK",
            isPatientHospitalized: true,
            additionalCare: "additionalCare",
            cancerType: {
              cancerType: "OTHER",
              otherCancerType: "fsdfdsfdsfs",
            },
            bestTimeToContact: ["bestTimeToContact", "bestTimeToContact"],
            languageInterpretation: {
              required: true,
              language: "language",
            },
            ageCondition: {
              age: "Above18",
              consented: true,
            },
            termsAndConditions: {
              accepted: true,
              acceptedDate: new Date(),
              termsAndConditionsVersion: "termsAndConditionsVersion",
            },
            creator: {
              creatorType: "PATIENT",
              patientUserId: "1234",
              sourceOfEnquiry: {
                sourceOfEnquiry: "ICLINIQ_SUBSITE",
              },
              patientAdditionalEmail: ["patientAdditionalEmail"],
              patientAdditionalPhone: ["patientAdditionalPhone"],
            },
            reference: {
              reference: "OTHER",
              otherDetails: "other Details",
            },
            id: "123333",
            name: "Inquiry",
            version: 1,
            versionComments: "versionComments",
            auditHistory: new Set(),
            isNew: false,
            inquiryStatus: "PENDING",
        };

        const event: PmcReAssignedToInquiry = {
            name: "PmcReAssignedToInquiry",
            id: "id",
            createdOn: expect.any(Date),
            aggregateId: "123333",
            aggregateName: "Inquiry",
            aggregateVersion: 1,
            sourceCommand: {
               name: "ReAssignPmcForInquiryCommand",
                comments: "comments", 
            },
            workflowInstanceId: "workflowId",
            assignments: {
                PMC: {
                    assignedTo: "PMC",
                    assignedUserId: "1234",
                    assignedDate: expect.any(Date),
                    assignmentMode: {
                        assignmentMode: "MANUAL",
                        assignedByUserId: "1234",
                    }

                },
            },
            createdBy: "1234"
        }

        const result = await applyPmcReAssignedToInquiry(inquiry, event);
        expect(result).toEqual({
            ...inquiry,
            isNew: false,
            versionComments: event.sourceCommand.comments,
            assignments: event.assignments,
            auditHistory: new Set([
                ...inquiry.auditHistory,
                {
                  comments: event.sourceCommand.comments,
                  version: inquiry.version,
                  createdBy: event.createdBy,
                  commandName: event.sourceCommand.name,
                  timestamp: expect.any(Date)
                },
              ]),
          });
    });
});

