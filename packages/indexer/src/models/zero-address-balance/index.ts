import { acquireLock, redis } from "@/common/redis";
import _ from "lodash";
import { config } from "@/config/index";
import cron from "node-cron";
import { logger } from "@/common/logger";
import { idb, pgp } from "@/common/db";
import { toBuffer } from "@/common/utils";
import { AddressZero } from "@ethersproject/constants";

export class ZeroAddressBalance {
  public static key = `zero-address-balance`;

  public static async count(contract: string, tokenId: string, incrementBy = 1) {
    const member = `${contract}*${tokenId}`;
    await redis.zincrby(ZeroAddressBalance.key, incrementBy, member);
  }

  public static async popCounts(count = 200) {
    const results: { contract: string; tokenId: string; balance: number }[] = [];
    const counts = await redis.zpopmax(ZeroAddressBalance.key, count);

    for (let i = 0; i < counts.length; i += 2) {
      const [contract, tokenId] = _.split(counts[i], "*");
      results.push({
        contract,
        tokenId,
        balance: _.toInteger(counts[i + 1]),
      });
    }

    return results;
  }
}

if (config.doBackgroundWork) {
  cron.schedule("*/30 * * * * *", async () => {
    try {
      const lock = await acquireLock("record-zero-address-balance", 30 - 5);
      if (lock) {
        const count = 200;
        let balances = [];

        do {
          balances = await ZeroAddressBalance.popCounts(count);

          if (!_.isEmpty(balances)) {
            const columns = new pgp.helpers.ColumnSet(["contract", "token_id", "owner", "amount"], {
              table: "nft_balances",
            });

            const queries: string[] = [];

            for (const balance of balances) {
              queries.push(`
                INSERT INTO "nft_balances" (
                  "contract",
                  "token_id",
                  "owner",
                  "amount"
                ) VALUES ${pgp.helpers.values(
                  {
                    contract: toBuffer(balance.contract),
                    tokenId: balance.tokenId,
                    owner: toBuffer(AddressZero),
                    balance: balance.balance,
                  },
                  columns
                )} ($/contract/, $/tokenId/, $/owner/, $/balance/)
               ON CONFLICT ("contract", "token_id", "owner") DO
               UPDATE SET amount = nft_balances.amount + EXCLUDED.amount`);
            }

            if (!_.isEmpty(queries)) {
              await idb.tx(async (t) => t.batch(queries.map((q) => t.none(q))));
            }
          }
        } while (balances.length === count);
      }
    } catch (error) {
      logger.error(
        "record-zero-address-balance",
        `failed to record zero adderss balance error ${error}`
      );
    }
  });
}
