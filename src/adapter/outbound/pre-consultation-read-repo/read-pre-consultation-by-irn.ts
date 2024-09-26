import { Result } from "true-myth";
import type { PreConsultation } from "../../../core/domain/model/types/pre-consultation-aggregate.js";
import type {
  PreConsultationByIrnUnknownError,
  GetPreConsultationByIrnError,
} from "../../../core/ports/pre-consultation-ports.js";
import { preConsultationPreConsultation } from "../collections.js";
import { query, type DataClient } from "@icliniqSmartDoctor/reactive-framework";

export const readPreConsultationByIrn = async (
  dataClient: DataClient,
  irn: string
): Promise<Result<PreConsultation[], GetPreConsultationByIrnError>> => {
  try {
    const queryFilters = createQueryFilters(irn);
    const queryFields = ["id"];

    const queryResult = await query(dataClient, {
      collectionName: preConsultationPreConsultation,
      fieldsToGet: queryFields,
      filters: queryFilters,
    });

    if (queryResult.isErr) {
      return Result.err(queryResult.error);
    }
    
    return Result.ok(queryResult.value as unknown as PreConsultation[]);
  } catch (error) {
    const unknownError = preConsultationByIrnUnknownError(
      irn,
      JSON.stringify(error)
    );
    return Result.err(unknownError);
  }
};

const createQueryFilters = (irn: string) => ({
  additional: [
    {
      value: irn,
      type: "_eq",
      field: "IRN",
    },
  ],
});

export const preConsultationByIrnUnknownError = (
  irn: string,
  error: string
): PreConsultationByIrnUnknownError => ({
  type: "IOError",
  error: {
    type: "PreConsultationByIrnUnknownError",
    code: "PC-APP-ADP-PCBIUE",
    description: `No data found for the provided IRN: ${irn}`,
    data: error,
    systemError: new Error(`No data found for the provided IRN: ${irn}`),
  },
  subtype: "InternalServerError",
  severity: "HIGH",
});
