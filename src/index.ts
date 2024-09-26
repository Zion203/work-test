import express from "express";
import { expressMiddleware } from "@apollo/server/express4";
import { projectNumber, dataClientUrl, loggerFlag, type ApplicationContext, getApplicationContextFromGQLRequest, initalizeLocalEnvironmentVars, initApolloServer } from "@icliniqSmartDoctor/reactive-framework";
import { typeDefs } from "./adapter/inbound/graphql/schema.js";
import { resolvers } from "./adapter/inbound/graphql/resolvers.js";

const envFilePath = './.env';
initalizeLocalEnvironmentVars(envFilePath);

const {app, httpServer, server} = await initApolloServer(typeDefs, resolvers);

app.use(
  "/pre-consultation",
  express.json(),
  expressMiddleware(server, {
    context: async ({ req }): Promise<ApplicationContext> => {
      const context = await getApplicationContextFromGQLRequest(
        req,
        "PRE-CONSULTATION",
        projectNumber(),
        loggerFlag(),
        {
          dataClientUrl: dataClientUrl(),
          directusTokenSecretName: "DIRECTUS_SERVICE_ACCOUNT_PRE_CONSULTATION_ACCESS",
          context: {}
        }
      );
      if (context.isErr) {
        throw new Error(JSON.stringify(context.error));
      }
      return context.value;
    },
  })
);

await new Promise<void>((resolve) =>
  httpServer.listen({ port: 4000 }, resolve)
);
console.log("Server ready at http://localhost:4000/");
