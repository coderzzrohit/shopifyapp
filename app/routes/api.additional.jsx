import shopify, { authenticate, unauthenticated } from "../shopify.server";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { IndexTable, ButtonGroup, Button } from "@shopify/polaris";
import { useState } from "react";
export async function loader({ request }) {
  // const { admin } = await shopify.authenticate.admin(request);
  const { sessionToken } = await authenticate.public.checkout(request);
  const { admin } = await unauthenticated.admin(sessionToken.dest);

  const response = await admin.graphql(
    `#graphql 
    query getProducts {
      products (first: 10) {
        edges {
          node {
            id
            title
          }
        }
      }
    }`,
  );

  const data = await response.json();
  return json(data);
}
