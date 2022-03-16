/* eslint-disable @typescript-eslint/no-explicit-any */

import { Request, RouteOptions } from "@hapi/hapi";
import Joi from "joi";

import { edb } from "@/common/db";
import { logger } from "@/common/logger";
import { formatEth, fromBuffer, toBuffer } from "@/common/utils";
import { getOrderSourceMetadata } from "@/orderbook/orders/utils";

const version = "v1";

export const getTokensDetailsV2Options: RouteOptions = {
  description: "Tokens with metadata",
  notes:
    "Get a list of tokens with full metadata. This is useful for showing a single token page, or scenarios that require more metadata. If you don't need this metadata, you should use the <a href='#/tokens/getTokensV1'>tokens</a> API, which is much faster.",
  tags: ["api", "tokens"],
  validate: {
    query: Joi.object({
      collection: Joi.string().lowercase(),
      contract: Joi.string()
        .lowercase()
        .pattern(/^0x[a-f0-9]{40}$/),
      token: Joi.string()
        .lowercase()
        .pattern(/^0x[a-f0-9]{40}:[0-9]+$/),
      tokenSetId: Joi.string().lowercase(),
      attributes: Joi.object().unknown(),
      sortBy: Joi.string()
        .valid("floorAskPrice", "topBidValue")
        .default("floorAskPrice"),
      limit: Joi.number().integer().min(1).max(50).default(20),
      continuation: Joi.string().pattern(/^((\d+|null)_\d+|\d+)$/), // 485_34, null_45 or 25 allowed
    })
      .or("collection", "contract", "token", "tokenSetId")
      .oxor("collection", "contract", "token", "tokenSetId")
      .with("attributes", "collection"),
  },
  response: {
    schema: Joi.object({
      tokens: Joi.array().items(
        Joi.object({
          token: Joi.object({
            contract: Joi.string()
              .lowercase()
              .pattern(/^0x[a-f0-9]{40}$/)
              .required(),
            tokenId: Joi.string()
              .pattern(/^[0-9]+$/)
              .required(),
            name: Joi.string().allow(null, ""),
            description: Joi.string().allow(null, ""),
            image: Joi.string().allow(null, ""),
            collection: Joi.object({
              id: Joi.string().allow(null),
              name: Joi.string().allow(null, ""),
            }),
            lastBuy: {
              value: Joi.number().unsafe().allow(null),
              timestamp: Joi.number().unsafe().allow(null),
            },
            lastSell: {
              value: Joi.number().unsafe().allow(null),
              timestamp: Joi.number().unsafe().allow(null),
            },
            owner: Joi.string().required(),
            attributes: Joi.array().items(
              Joi.object({
                key: Joi.string(),
                value: Joi.string(),
              })
            ),
          }),
          market: Joi.object({
            floorAsk: {
              id: Joi.string().allow(null),
              price: Joi.number().unsafe().allow(null),
              maker: Joi.string()
                .lowercase()
                .pattern(/^0x[a-f0-9]{40}$/)
                .allow(null),
              validFrom: Joi.number().unsafe().allow(null),
              validUntil: Joi.number().unsafe().allow(null),
              source: Joi.any(),
            },
            topBid: Joi.object({
              id: Joi.string().allow(null),
              value: Joi.number().unsafe().allow(null),
              maker: Joi.string()
                .lowercase()
                .pattern(/^0x[a-f0-9]{40}$/)
                .allow(null),
              validFrom: Joi.number().unsafe().allow(null),
              validUntil: Joi.number().unsafe().allow(null),
            }),
          }),
        })
      ),
      continuation: Joi.string()
        .pattern(/^((\d+|null)_\d+|\d+)$/)
        .allow(null),
    }).label(`getTokensDetails${version.toUpperCase()}Response`),
    failAction: (_request, _h, error) => {
      logger.error(
        `get-tokens-details-${version}-handler`,
        `Wrong response schema: ${error}`
      );
      throw error;
    },
  },
  handler: async (request: Request) => {
    const query = request.query as any;

    try {
      let baseQuery = `
        SELECT
          "t"."contract",
          "t"."token_id",
          "t"."name",
          "t"."description",
          "t"."image",
          "t"."collection_id",
          "c"."name" as "collection_name",
          "t"."last_buy_value",
          "t"."last_buy_timestamp",
          "t"."last_sell_value",
          "t"."last_sell_timestamp",
          (
            SELECT "nb"."owner" FROM "nft_balances" "nb"
            WHERE "nb"."contract" = "t"."contract"
              AND "nb"."token_id" = "t"."token_id"
              AND "nb"."amount" > 0
            LIMIT 1
          ) AS "owner",
          (
            SELECT
              array_agg(json_build_object('key', "ak"."key", 'value', "a"."value"))
            FROM "token_attributes" "ta"
            JOIN "attributes" "a"
              ON "ta"."attribute_id" = "a"."id"
            JOIN "attribute_keys" "ak"
              ON "a"."attribute_key_id" = "ak"."id"
            WHERE "ta"."contract" = "t"."contract"
              AND "ta"."token_id" = "t"."token_id"
          ) AS "attributes",
          "t"."floor_sell_id",
          "t"."floor_sell_value",
          "t"."floor_sell_maker",
          DATE_PART('epoch', LOWER("os"."valid_between")) AS "floor_sell_valid_from",
          COALESCE(
            NULLIF(date_part('epoch', UPPER("os"."valid_between")), 'Infinity'),
            0
          ) AS "floor_sell_valid_until",
          "os"."source_id" AS "floor_sell_source_id",
          "t"."top_buy_id",
          "t"."top_buy_value",
          "t"."top_buy_maker",
          DATE_PART('epoch', LOWER("ob"."valid_between")) AS "top_buy_valid_from",
          COALESCE(
            NULLIF(DATE_PART('epoch', UPPER("ob"."valid_between")), 'Infinity'),
            0
          ) AS "top_buy_valid_until"
        FROM "tokens" "t"
        LEFT JOIN "orders" "os"
          ON "t"."floor_sell_id" = "os"."id"
        LEFT JOIN "orders" "ob"
          ON "t"."top_buy_id" = "ob"."id"
        JOIN "collections" "c"
          ON "t"."collection_id" = "c"."id"
      `;

      if (query.tokenSetId) {
        baseQuery += `
          JOIN "token_sets_tokens" "tst"
            ON "t"."contract" = "tst"."contract"
            AND "t"."token_id" = "tst"."token_id"
        `;
      }

      // Filters
      const conditions: string[] = [];
      if (query.collection) {
        conditions.push(`"t"."collection_id" = $/collection/`);
      }
      if (query.contract) {
        (query as any).contract = toBuffer(query.contract);
        conditions.push(`"t"."contract" = $/contract/`);
      }
      if (query.token) {
        const [contract, tokenId] = query.token.split(":");

        (query as any).contract = toBuffer(contract);
        (query as any).tokenId = tokenId;
        conditions.push(`"t"."contract" = $/contract/`);
        conditions.push(`"t"."token_id" = $/tokenId/`);
      }
      if (query.tokenSetId) {
        conditions.push(`"tst"."token_set_id" = $/tokenSetId/`);
      }

      if (query.attributes) {
        const attributes: { key: string; value: string }[] = [];
        Object.entries(query.attributes).forEach(([key, values]) => {
          (Array.isArray(values) ? values : [values]).forEach((value) =>
            attributes.push({ key, value })
          );
        });

        for (let i = 0; i < attributes.length; i++) {
          (query as any)[`key${i}`] = attributes[i].key;
          (query as any)[`value${i}`] = attributes[i].value;
          conditions.push(`
            EXISTS (
              SELECT FROM "token_attributes" "ta"
              JOIN "attributes" "a"
                ON "ta"."attribute_id" = "a"."id"
              JOIN "attribute_keys" "ak"
                ON "a"."attribute_key_id" = "ak"."id"
              WHERE "ta"."contract" = "t"."contract"
                AND "ta"."token_id" = "t"."token_id"
                AND "ak"."key" = $/key${i}/
                AND "a"."value" = $/value${i}/
            )
          `);
        }
      }

      // Continue with the next page, this depends on the sorting used
      if (query.continuation && !query.token) {
        const contArr = query.continuation.split("_");

        if (query.collection || query.attributes) {
          if (contArr.length !== 2) {
            logger.error(
              "get-tokens",
              JSON.stringify({
                msg: "Invalid continuation string used",
                params: request.query,
              })
            );

            throw new Error("Invalid continuation string used");
          }
          switch (query.sortBy) {
            case "topBidValue":
              if (contArr[0] !== "null") {
                conditions.push(`
                  ("t"."top_buy_value", "t"."token_id") < ($/topBuyValue:raw/, $/tokenId:raw/)
                  OR (t.top_buy_value is null)
                 `);
                (query as any).topBuyValue =
                  contArr[0] !== "null"
                    ? contArr[0]
                    : "1000000000000000000000000";
                (query as any).tokenId = contArr[1];
              } else {
                conditions.push(
                  `(t.top_buy_value is null AND t.token_id > $/tokenId/)`
                );
                (query as any).tokenId = contArr[1];
              }
              break;
            case "floorAskPrice":
            default:
              if (contArr[0] !== "null") {
                conditions.push(`(
                  (t.floor_sell_value, "t"."token_id") > ($/floorSellValue/, $/tokenId/)
                  OR (t.floor_sell_value is null)
                )
                `);
                (query as any).floorSellValue =
                  contArr[0] !== "null"
                    ? contArr[0]
                    : "1000000000000000000000000";
                (query as any).tokenId = contArr[1];
              } else {
                conditions.push(
                  `(t.floor_sell_value is null AND t.token_id > $/tokenId/)`
                );
                (query as any).tokenId = contArr[1];
              }
              break;
          }
        } else {
          conditions.push(`"t"."token_id" > $/tokenId/`);
          (query as any).tokenId = contArr[1] ? contArr[1] : contArr[0];
        }
      }

      if (conditions.length) {
        baseQuery += " WHERE " + conditions.map((c) => `(${c})`).join(" AND ");
      }

      // Sorting
      // Only allow sorting on floorSell and topBid when we filter by collection or attributes
      if (query.collection || query.attributes) {
        switch (query.sortBy) {
          case "topBidValue": {
            baseQuery += ` ORDER BY "t"."top_buy_value" DESC NULLS LAST, "t"."token_id" DESC`;
            break;
          }

          case "floorAskPrice":
          default: {
            baseQuery += ` ORDER BY "t"."floor_sell_value" ASC NULLS LAST, "t"."token_id"`;
            break;
          }
        }
      } else if (query.contract) {
        baseQuery += ` ORDER BY "t"."token_id" ASC`;
      }

      baseQuery += ` LIMIT $/limit/`;

      const rawResult = await edb.manyOrNone(baseQuery, query);

      /** Depending on how we sorted, we use that sorting key to determine the next page of results
          Possible formats:
            topBidValue_tokenid
            floorAskPrice_tokenid
            tokenid
       **/
      let continuation = null;
      if (rawResult.length === query.limit) {
        continuation = "";

        // Only build a "value_tokenid" continuation string when we filter on collection or attributes
        // Otherwise continuation string will just be based on the last tokenId. This is because only use sorting
        // when we have collection/attributes
        if (query.collection || query.attributes) {
          switch (query.sortBy) {
            case "topBidValue":
              continuation =
                rawResult[rawResult.length - 1].top_buy_value || "null";
              break;
            case "floorAskPrice":
              continuation =
                rawResult[rawResult.length - 1].floor_sell_value || "null";
              break;
            default:
              break;
          }

          continuation += "_" + rawResult[rawResult.length - 1].token_id;
        } else {
          continuation = rawResult[rawResult.length - 1].token_id;
        }
      }

      const result = rawResult.map((r) => ({
        token: {
          contract: fromBuffer(r.contract),
          tokenId: r.token_id,
          name: r.name,
          description: r.description,
          image: r.image,
          collection: {
            id: r.collection_id,
            name: r.collection_name,
          },
          lastBuy: {
            value: r.last_buy_value ? formatEth(r.last_buy_value) : null,
            timestamp: r.last_buy_timestamp,
          },
          lastSell: {
            value: r.last_sell_value ? formatEth(r.last_sell_value) : null,
            timestamp: r.last_sell_timestamp,
          },
          owner: fromBuffer(r.owner),
          attributes: r.attributes || [],
        },
        market: {
          floorAsk: {
            id: r.floor_sell_id,
            price: r.floor_sell_value ? formatEth(r.floor_sell_value) : null,
            maker: r.floor_sell_maker ? fromBuffer(r.floor_sell_maker) : null,
            validFrom: r.floor_sell_valid_from,
            validUntil: r.floor_sell_value ? r.floor_sell_valid_until : null,
            source: r.floor_sell_id
              ? getOrderSourceMetadata(
                  r.floor_sell_source_id
                    ? fromBuffer(r.floor_sell_source_id)
                    : null,
                  fromBuffer(r.contract),
                  r.token_id
                )
              : null,
          },
          topBid: {
            id: r.top_buy_id,
            value: r.top_buy_value ? formatEth(r.top_buy_value) : null,
            maker: r.top_buy_maker ? fromBuffer(r.top_buy_maker) : null,
            validFrom: r.top_buy_valid_from,
            validUntil: r.top_buy_value ? r.top_buy_valid_until : null,
          },
        },
      }));

      return {
        tokens: result,
        continuation,
      };
    } catch (error) {
      logger.error(
        `get-tokens-details-${version}-handler`,
        `Handler failure: ${error}`
      );
      throw error;
    }
  },
};
