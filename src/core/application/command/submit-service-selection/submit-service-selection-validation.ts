import { z } from "zod";
import { isValidPhoneNumber } from "libphonenumber-js";
import { doesNotHasHtmlTags } from "@icliniqSmartDoctor/reactive-framework";

const supplementaryServiceSchema = z.object({
  name: z.enum(["ONCOLOGY_PAIN_MANAGEMENT", "INTEGRATIVE_MEDICINE"]),
});

const videoConsultationSchema = z.object({
  name: z.literal("VIDEO_CONSULTATION"),
  preferredPhysicianName: z.string().refine(doesNotHasHtmlTags).optional(),
  supplimentaryService: z.array(supplementaryServiceSchema).optional(),
  isMultiMdConsult: z.boolean().optional(),
});

const writtenConsultationSchema = z.object({
  name: z.literal("WRITTEN_CONSULTATION"),
  preferredPhysicianName: z.string().refine(doesNotHasHtmlTags).optional(),
  supplimentaryService: z.array(supplementaryServiceSchema).optional(),
  isMultiMdConsult: z.boolean().optional(),
});

const radiologyReviewSchema = z.object({
  name: z.literal("RADIOLOGY_REVIEW"),
});

const travelToNewYorkSchema = z.object({
  name: z.literal("TRAVEL_TO_MSK_NEW_YORK"),
});

const selfCourierSchema = z.object({
  courierType: z.literal("SELF_COURIER"),
  trackingId: z.string().refine(doesNotHasHtmlTags),
  contactPersonName: z.string().refine(doesNotHasHtmlTags),
  contactPersonPhone: z.string().refine(isValidPhoneNumber),
});

const pickUpAssistanceSchema = z.object({
  courierType: z.literal("PICK_UP_ASSISTANCE"),
  collectSpecimenFrom: z.enum(["LOCATION", "HOSPITAL"]),
});

const standardPathologyTypeSchema = z.object({
  type: z.literal("STANDARD_PATHOLOGY"),
  courierDetails: selfCourierSchema,
});

const extensivePathologyTypeSchema = z.object({
  type: z.literal("EXTENSIVE_PATHOLOGY"),
  courierDetails: z.union([selfCourierSchema, pickUpAssistanceSchema]),
});

const stainedSlidesSchema = z.object({
  type: z.literal("STAINED_SLIDES"),
  pathologyType: standardPathologyTypeSchema,
});

const unstainedSlidesSchema = z.object({
  type: z.literal("UNSTAINED_SLIDES"),
  pathologyType: extensivePathologyTypeSchema,
});

const pathologyBlockSchema = z.object({
  type: z.literal("PATHOLOGY_BLOCK"),
  pathologyType: extensivePathologyTypeSchema,
});

const unstainedSlidesAndPathologyBlockSchema = z.object({
  type: z.literal("UNSTAINED_SLIDES_AND_PATHOLOGY_BLOCK"),
  pathologyType: extensivePathologyTypeSchema,
});

const stainedSlidesAndPathologyBlockSchema = z.object({
  type: z.literal("STAINED_SLIDES_AND_PATHOLOGY_BLOCK"),
  pathologyType: z.union([
    standardPathologyTypeSchema,
    extensivePathologyTypeSchema,
  ]),
});

const noneSchema = z.object({
  type: z.literal("NONE"),
});

const slideTypeSchema = z.union([
  stainedSlidesSchema,
  unstainedSlidesSchema,
  pathologyBlockSchema,
  unstainedSlidesAndPathologyBlockSchema,
  stainedSlidesAndPathologyBlockSchema,
  noneSchema,
]);

const pathologyReviewSchema = z.object({
  name: z.literal("PATHOLOGY_REVIEW"),
  slideType: slideTypeSchema,
});

export const serviceSchema = z.union([
  videoConsultationSchema,
  writtenConsultationSchema,
  radiologyReviewSchema,
  travelToNewYorkSchema,
  pathologyReviewSchema,
]);

export const commandValidationSchema = z
  .object({
    inquiryId: z.string().refine(doesNotHasHtmlTags),
    IRN: z.string().refine(doesNotHasHtmlTags),
    //services: z.array(serviceSchema),
  })
  .required();
