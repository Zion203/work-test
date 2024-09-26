import {
  type Query,
  queryHandlerSimple,
  type QueryHandler,
  type ApplicationContext,
} from "@icliniqSmartDoctor/reactive-framework";
import { z } from "zod";
import { preConsultationMedicalReport } from "../../../../adapter/outbound/collections.js";

export type MedicalReportQuery = Query<"MedicalReportQuery"> & {
  IRN: string;
};

type MedicalReportQueryResult = {
  id: string;
  reportCategory: string;
  reportType: string;
  reportDescription: string;
  reportTakenDate: string;
  reportStatus: string;
  referenceDocumentId: string;
};

type MedicalReportResult = MedicalReportQueryResult[];

const medicalReportQueryValidationSchema = z
  .object({})


export const medicalReportDetailsHandler: QueryHandler<MedicalReportQuery, MedicalReportResult> = queryHandlerSimple(
  medicalReportQueryValidationSchema, 
  (_c: ApplicationContext, query:MedicalReportQuery) => ({
    collectionName: preConsultationMedicalReport,
    fieldsToGet: [
      "id",
      "reportCategory",
      "reportType",
      "reportDescription",
      "reportTakenDate",
      "reportStatus",
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
