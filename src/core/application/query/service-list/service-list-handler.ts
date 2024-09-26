import {
  type Query,
  doesNotHasHtmlTags,
  validateNonEmptyString,
  queryHandlerSimple,
  type QueryHandler,
  type ApplicationContext,
} from "@icliniqSmartDoctor/reactive-framework";
import { z } from "zod";
import { preConsultationPreConsultation } from "../../../../adapter/outbound/collections.js";

export type ServiceListQuery = Query<"ServiceListQuery"> & {
  inquiryId: string[];
};

type ServiceList = {
  id: string;
  inquiryId: string;
  primaryConsultationService: string;
};

type ServiceListQueryResult = ServiceList[];

const serviceListQueryValidationSchema = z
  .object({
    inquiryId: z.array(
      z.string().refine(doesNotHasHtmlTags).refine(validateNonEmptyString)
    ),
  })
  .required();

export const serviceListHandler: QueryHandler<
  ServiceListQuery,
  ServiceListQueryResult
> = queryHandlerSimple(
  serviceListQueryValidationSchema,
  (_c: ApplicationContext, query: ServiceListQuery) => ({
    collectionName: preConsultationPreConsultation,
    fieldsToGet: ["id", "inquiryId", "primaryConsultationService"],
    filters: createQueryFilters(query.inquiryId),
  })
);

const createQueryFilters = (inquiryId: string[]) => ({
  additional: [
    {
      value: inquiryId,
      type: "_in",
      field: "inquiryId",
    },
  ],
});
