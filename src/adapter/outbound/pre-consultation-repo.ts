import {
  dataToDomainMapperDirectus,
  directusSchema,
  domainToDataMapperDirectus,
} from "./pre-consultation-repo-directus.js";

export const domainToDataMapper = domainToDataMapperDirectus;

export const dataToDomainMapper = dataToDomainMapperDirectus;

export const schema = directusSchema;
