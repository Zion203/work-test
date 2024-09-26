//todo: code-gen generated file, please verify and make changes and remove this comment once verified
import {
  mutationAPI,
  queryAPI,
  scalars,
  type GraphQLFormattedError,
} from "@icliniqSmartDoctor/reactive-framework";
import { type ManagedError } from "@icliniqSmartDoctor/shared-kernel";
import { GraphQLError } from "graphql";
import { submitServiceSelectionHandler } from "../../../core/application/command/submit-service-selection/submit-service-selection-handler.js";
import { serviceDetailsHandler } from "../../../core/application/query/service-details/service-details-handler.js";
import { serviceListHandler } from "../../../core/application/query/service-list/service-list-handler.js";
import { medicalReportDetailsHandler } from "../../../core/application/query/medical-report-details/medical-report-details.js";
import { govermentIdDetailsHandler } from "../../../core/application/query/government-id-details/govt-id-details.js";

const errorConstructor = (
  type: string,
  err: ManagedError | GraphQLFormattedError
): Error =>
  new GraphQLError(type, {
    extensions: err,
  });

export const resolvers = {
  ...scalars,
  Query: {
    serviceDetails: queryAPI(serviceDetailsHandler, errorConstructor),
    serviceList: queryAPI(
      serviceListHandler,
      errorConstructor
    ),
    medicalReportDetails: queryAPI(medicalReportDetailsHandler, errorConstructor),
    govermentIdDetails: queryAPI(govermentIdDetailsHandler, errorConstructor),
  },
  Mutation: {
    submitServiceSelection: mutationAPI(
      submitServiceSelectionHandler,
      errorConstructor
    ),
  },
};
