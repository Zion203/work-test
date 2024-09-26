import {
  queryHandlerSimple,
  type ApplicationContext,
  type Query,
  type QueryHandler,
} from "@icliniqSmartDoctor/reactive-framework";
import { z } from "zod";
import { preConsultationPreConsultation } from "../../../../adapter/outbound/collections.js";

export type ServiceDetailsQuery = Query<"ServiceDetailsQuery"> & {
  IRN: string;
};

type ServiceDetails = {
  id: string;
  services: string[];
  preferredPhysicianName: string;
  isMultiMdConsult: boolean;
};

type ServiceDetailsQueryResult = { serviceDetails: ServiceDetails[] };

const serviceDetailValidationSchema = z.object({});

export const serviceDetailsHandler: QueryHandler<
  ServiceDetailsQuery,
  ServiceDetailsQueryResult
> = queryHandlerSimple(
  serviceDetailValidationSchema,
  (_c: ApplicationContext, query: ServiceDetailsQuery) => ({
    collectionName: preConsultationPreConsultation,
    fieldsToGet: ["id", "services", "preferredPhysicianName", "isMultiMdConsult"],
    filters: createQueryFilters(query),
    sort: [],
    limit: 1,
    offset: 0,
  })
);

const createQueryFilters = (serviceDetailsQuery: ServiceDetailsQuery) => ({
  additional: [
    {
      value: serviceDetailsQuery.IRN,
      type: "_eq",
      field: "IRN",
    },
  ],
});
