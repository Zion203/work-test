import {
    type Query,
    queryHandlerSimple,
    type QueryHandler,
    type ApplicationContext,
  } from "@icliniqSmartDoctor/reactive-framework";
import { z } from "zod";
import { preConsultationPatientGovtIdentification } from "../../../../adapter/outbound/collections.js";
  
  export type GovtIdDetailsQuery = Query<"GovtIdDetailsQuery"> & {
    IRN: string;
  };
  
  type GovtIdDetailsQueryResult = {
    id: string;
    identificationType: string;
    identificationNumber: string;
    otherIdentificationName: string;
    identificationStatus: string;
    referenceDocumentId: string;
  };
  
  type GovtIdDetailsResult = GovtIdDetailsQueryResult[];
  
  const GovtIdDetailsQueryValidationSchema = z
    .object({})
  
  
  export const govermentIdDetailsHandler: QueryHandler<GovtIdDetailsQuery, GovtIdDetailsResult> = queryHandlerSimple(
    GovtIdDetailsQueryValidationSchema, 
    (_c: ApplicationContext, query:GovtIdDetailsQuery) => ({
      collectionName: preConsultationPatientGovtIdentification,
      fieldsToGet: [
        "id",
        "identificationType",
        "identificationNumber",
        "otherIdentificationName",
        "identificationStatus",
        "referenceDocumentId",
      ],
      filters: createQueryFilters(query.IRN),
  
    })
  )
  
  const createQueryFilters = (irn: string) => ({
    additional: [
      {
        value: irn,
        type: "_in",
        field: "IRN",
      },
    ],
  });
  