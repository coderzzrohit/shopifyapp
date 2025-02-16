import shopify, {
  authenticate,
  unauthenticated,
  getAllSessionData,
  apiVersion,
} from "../shopify.server";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { IndexTable, ButtonGroup, Button } from "@shopify/polaris";
import { useState } from "react";

export async function loader({ request }) {
  console.log({request});
  const { sessionToken } = await authenticate.public.checkout(request);
  
  const accessToken = await getAllSessionData(sessionToken.dest);
  if(accessToken?.result){
    return json({ error: "Access token not found" }, { status: 403 }); 
  }
  const maintoken = accessToken.accessToken;
  if (!maintoken) {
    return json({ error: "Access token not found" }, { status: 403 });
  }

  const query = `
  {
      orders(first: 10) {
          edges {
              node {
                  id
                  tags
              } 
          }
      }
  }
  `;

  try {
    const response = await fetch(
      `https://${sessionToken.dest}/admin/api/${apiVersion}/graphql.json`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/graphql",
          "X-Shopify-Access-Token": maintoken,
        },
        body: query,
      },
    );

    const data = await response.json();
    return new Response(JSON.stringify(data?.data?.orders?.edges), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching orders:", error);
    throw new Response("Failed to fetch orders", { status: 500 });
  }
}

export async function action({ request }) {
  let data = await request.formData();
  data = Object.fromEntries(data);
  const customerId = data.customerId;
  const productId = data.productId;
  const shop = data.shop;
  const _action = data._action;

  if (!customerId || !productId || !shop || !_action) {
    return json({
      message:
        "Missing data. Required data: customerId, productId, shop, _action",
      method: _action,
    });
  }

  let response;

  switch (_action) {
    case "CREATE":
      // Handle POST request logic here
      // For example, adding a new item to the wishlist
      const wishlist = await db.wishlist.create({
        data: {
          customerId,
          productId,
          shop,
        },
      });

      response = json({
        message: "Product added to wishlist",
        method: _action,
        wishlisted: true,
      });
      return cors(request, response);

    case "PATCH":
      // Handle PATCH request logic here
      // For example, updating an existing item in the wishlist
      return json({ message: "Success", method: "Patch" });

    case "DELETE":
      // Handle DELETE request logic here (Not tested)
      // For example, removing an item from the wishlist
      await db.wishlist.deleteMany({
        where: {
          customerId: customerId,
          shop: shop,
          productId: productId,
        },
      });

      response = json({
        message: "Product removed from your wishlist",
        method: _action,
        wishlisted: false,
      });
      return cors(request, response);

    default:
      // Optional: handle other methods or return a method not allowed response
      return new Response("Method Not Allowed", { status: 405 });
  }
}
