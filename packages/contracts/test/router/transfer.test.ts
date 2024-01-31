import { Contract } from "@ethersproject/contracts";
import { AddressZero } from "@ethersproject/constants";
import { parseEther } from "@ethersproject/units";
import * as Sdk from "@reservoir0x/sdk/src";
import * as  ApprovalProxy from "@reservoir0x/sdk/src/router/v6/approval-proxy";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { expect } from "chai";
import { ethers } from "hardhat";

import {
  getChainId,
  reset,
  setupNFTs,
  setupRouterWithModules,
} from "../utils";

describe("ApprovalProxy Transfer", () => {
  const chainId = getChainId();

  let deployer: SignerWithAddress;
  let alice: SignerWithAddress;
  let bob: SignerWithAddress;
  let carol: SignerWithAddress;
  let dan: SignerWithAddress;
  let emily: SignerWithAddress;

  let erc721: Contract;
  let erc1155: Contract;
  let erc721cWithWhitelist: Contract;

  beforeEach(async () => {
    [deployer, alice, bob, carol, dan, emily] = await ethers.getSigners();

    ({ erc721, erc1155, erc721cWithWhitelist } = await setupNFTs(deployer, [
      Sdk.PaymentProcessor.Addresses.Exchange[chainId],
    ]));
    await setupRouterWithModules(chainId, deployer);
  });

  afterEach(reset);

  it("Fill multiple listings", async () => {
    const recipient = carol;

    const seller = alice;
    const tokenId1 = 0;

    const transferItem: ApprovalProxy.TransferItem = {
      items: [],
      recipient: recipient.address
    };

    const price1 = parseEther("1")
    transferItem.items.push({
      itemType: ApprovalProxy.ItemType.NATIVE,
      identifier: "0",
      token: AddressZero,
      amount: price1
    });

    {
      // Mint erc721 to seller
      await erc721.connect(seller).mint(tokenId1);
      transferItem.items.push({
        itemType: ApprovalProxy.ItemType.ERC721,
        identifier: tokenId1,
        token: erc721.address,
        amount: 1
      });
    }

    const tokenId3 = 0;
    const totalAmount3 = 9;
    {
      // Mint erc1155 to seller
      await erc1155.connect(seller).mintMany(tokenId3, totalAmount3);

      transferItem.items.push({
        itemType: ApprovalProxy.ItemType.ERC1155,
        identifier: tokenId3,
        token: erc1155.address,
        amount: totalAmount3
      });
    }

    const weth = new Sdk.Common.Helpers.WNative(ethers.provider, chainId);

    const price2 = parseEther("1");
    await weth.deposit(seller, price2);

    transferItem.items.push({
      itemType: ApprovalProxy.ItemType.ERC20,
      identifier: "0",
      token: weth.contract.address,
      amount: price2
    });

    const ethBalanceBefore = await recipient.getBalance();
    const wethBalanceBefore = await weth.getBalance(recipient.address);

    const result = ApprovalProxy.createTransferTxsFromTransferItem(transferItem, seller.address);
    for (const tx of result.txs) {
      await seller.sendTransaction(tx.txData)
    }

    const ethBalanceAfter = await recipient.getBalance();
    const token1OwnerAfter = await erc721.ownerOf(tokenId1);
    const token3BuyerBalanceAfter = await erc1155.balanceOf(recipient.address, tokenId3);
    const wethBalanceAfter = await weth.getBalance(recipient.address);

    expect(token1OwnerAfter).to.eq(recipient.address);
    expect(token3BuyerBalanceAfter).to.eq(totalAmount3);

    expect(wethBalanceAfter.sub(wethBalanceBefore)).to.eq(
      price2
    );

    expect(ethBalanceAfter.sub(ethBalanceBefore)).to.eq(
      price1
    );
  });

});
