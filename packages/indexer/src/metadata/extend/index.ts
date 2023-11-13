/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { config } from "@/config/index";
import { CollectionMetadata, TokenMetadata } from "../types";
import * as adidasOriginals from "./adidas-originals";
import * as admitOne from "./admit-one";
import * as artTennis from "./art-tennis";
import * as artblocks from "./artblocks";
import * as artblocksEngine from "./artblocks-engine";
import * as asyncBlueprints from "./async-blueprints";
import * as bayc from "./bayc";
import * as boredApeKennelClub from "./bored-ape-kennel-club";
import * as boysOfSummer from "./boys-of-summer";
import * as brainDrops from "./braindrops";
import * as chimpers from "./chimpers";
import * as courtyard from "./courtyard";
import * as cryptokicksIrl from "./cryptokicks-irl";
import * as cyberkongz from "./cyberkongz";
import * as feralFile from "./feral-file";
import * as forgottenPonies from "./forgotten-ponies";
import * as forgottenRunes from "./forgotten-runes";
import * as forgottenRunesAthenaeum from "./forgotten-runes-athenaeum";
import * as forgottenRunesWarriors from "./forgotten-runes-warriors";
import * as forgottenSouls from "./forgotten-souls";
import * as goldfinch from "./goldfinch";
import * as lilnouns from "./lilnouns";

// import * as loot from "./loot";
import * as mirageGalleryCurated from "./mirage-gallery-curated";
import * as moonbirds from "./moonbirds";
import * as mutantApeYachtClub from "./mutant-ape-yacht-club";
import * as nouns from "./nouns";
import * as quantumArt from "./quantum-art";
import * as sharedContracts from "./shared-contracts";
import * as shreddingSassy from "./shredding-sassy";
import * as soundxyz from "./soundxyz";
import * as tfoust from "./tfoust";
import * as utopiaAvatars from "./utopia-avatars";
import * as superrareShared from "./superrare-shared";
import * as foundationShared from "./foundation-shared";
import * as kanpaiPandas from "./kanpai-pandas";
import * as magiceden from "./magiceden";
import { CollectionsOverride } from "@/models/collections-override";

const extendCollection: any = {};
const extend: any = {};

export const hasExtendHandler = (contract: string) => extend[`${config.chainId},${contract}`];
export const hasExtendCollectionHandler = (contract: string) =>
  extendCollection[`${config.chainId},${contract}`];

export const extendCollectionMetadata = async (metadata: any, tokenId?: string) => {
  if (metadata) {
    if (extendCollection[`${config.chainId},${metadata.id}`]) {
      return extendCollection[`${config.chainId},${metadata.id}`].extendCollection(
        metadata,
        tokenId
      );
    } else {
      return metadata;
    }
  }
};

export const overrideCollectionMetadata = async (metadata: any) => {
  if (metadata) {
    const collectionsOverride = await CollectionsOverride.get(metadata.id);
    if (collectionsOverride) {
      return {
        ...metadata,
        ...collectionsOverride?.override,
        metadata: {
          ...metadata.metadata,
          ...collectionsOverride?.override?.metadata,
        },
      };
    }

    return metadata;
  }
};

export const extendMetadata = async (metadata: TokenMetadata) => {
  if (metadata) {
    if (extend[`${config.chainId},${metadata.contract.toLowerCase()}`]) {
      return extend[`${config.chainId},${metadata.contract.toLowerCase()}`].extend(metadata);
    } else {
      return metadata;
    }
  }
};

class ExtendLogic {
  public prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  public async extendCollection(metadata: CollectionMetadata, _tokenId = null) {
    metadata.id = `${metadata.contract}:${this.prefix}-${metadata.slug}`;
    metadata.tokenIdRange = null;
    metadata.tokenSetId = null;

    return { ...metadata };
  }
  public async extend(metadata: TokenMetadata) {
    metadata.collection = `${metadata.contract}:${this.prefix}-${metadata.slug}`;
    return { ...metadata };
  }
}

const ExtendLogicClasses = {
  opensea: new ExtendLogic("opensea"),
  courtyard: new ExtendLogic("courtyard"),
};

// Opensea Shared Contract
extendCollection["1,0x495f947276749ce646f68ac8c248420045cb7b5e"] = ExtendLogicClasses.opensea;
extendCollection["1,0x503a3039e9ce236e9a12e4008aecbb1fd8b384a3"] = ExtendLogicClasses.opensea;
extendCollection["1,0xd78afb925a21f87fa0e35abae2aead3f70ced96b"] = ExtendLogicClasses.opensea;
extendCollection["1,0xb6329bd2741c4e5e91e26c4e653db643e74b2b19"] = ExtendLogicClasses.opensea;
extendCollection["1,0xd8b7cc75e22031a72d7b8393113ef2536e17bde6"] = ExtendLogicClasses.opensea;
extendCollection["1,0x2d820afb710681580a55ca8077b57fba6dd9fd72"] = ExtendLogicClasses.opensea;
extendCollection["1,0x0faed6ddef3773f3ee5828383aaeeaca2a94564a"] = ExtendLogicClasses.opensea;
extendCollection["1,0x13927739076014913a3a7c207ef84c5be4780014"] = ExtendLogicClasses.opensea;
extendCollection["1,0x7a15b36cb834aea88553de69077d3777460d73ac"] = ExtendLogicClasses.opensea;
extendCollection["1,0x68d0f6d1d99bb830e17ffaa8adb5bbed9d6eec2e"] = ExtendLogicClasses.opensea;
extendCollection["1,0x33eecbf908478c10614626a9d304bfe18b78dd73"] = ExtendLogicClasses.opensea;
extendCollection["1,0x495f947276749ce646f68ac8c248420045cb7b5e"] = ExtendLogicClasses.opensea;
extendCollection["1,0x48b17a2c46007471b3eb72d16268eaecdd1502b7"] = ExtendLogicClasses.opensea;

// Courtyard
extendCollection["1,0xd4ac3ce8e1e14cd60666d49ac34ff2d2937cf6fa"] = ExtendLogicClasses.courtyard;

// CyberKongz
extendCollection["1,0x57a204aa1042f6e66dd7730813f4024114d74f37"] = cyberkongz;

// Admit One
extendCollection["1,0xd2a077ec359d94e0a0b7e84435eacb40a67a817c"] = admitOne;
extendCollection["4,0xa7d49d78ab0295ad5a857dc4d0ab16445663ab85"] = admitOne;

// Art Tennis
extendCollection["1,0x4d928ab507bf633dd8e68024a1fb4c99316bbdf3"] = artTennis;

// Rarible ERC721
extendCollection["1,0xc9154424b823b10579895ccbe442d41b9abd96ed"] = sharedContracts;
extendCollection["5,0xd8560c88d1dc85f9ed05b25878e366c49b68bef9"] = sharedContracts;

// Rarible ERC1155
extendCollection["1,0xb66a603f4cfe17e3d27b87a8bfcad319856518b8"] = sharedContracts;
extendCollection["5,0x7c4b13b5893cd82f371c5e28f12fb2f37542bbc5"] = sharedContracts;

// Zora
extendCollection["1,0xabefbc9fd2f806065b4f3c237d4b59d9a97bcac7"] = sharedContracts;

// Feral File
extendCollection["1,0x2a86c5466f088caebf94e071a77669bae371cd87"] = feralFile;

// BrainDrops
extendCollection["1,0xdfde78d2baec499fe18f2be74b6c287eed9511d7"] = brainDrops;

// Quantum Art
extendCollection["1,0x46ac8540d698167fcbb9e846511beb8cf8af9bd8"] = quantumArt;

// ArtBlocks
extendCollection["1,0x059edd72cd353df5106d2b9cc5ab83a52287ac3a"] = artblocks;
extendCollection["1,0xa7d8d9ef8d8ce8992df33d8b8cf4aebabd5bd270"] = artblocks;
extendCollection["1,0x99a9b7c1116f9ceeb1652de04d5969cce509b069"] = artblocks;
extendCollection["5,0xda62f67be7194775a75be91cbf9feedcc5776d4b"] = artblocks;
extendCollection["5,0xb614c578062a62714c927cd8193f0b8bfb90055c"] = artblocks;

// ArtBlocks Engine
extendCollection["1,0xbdde08bd57e5c9fd563ee7ac61618cb2ecdc0ce0"] = artblocksEngine;
extendCollection["1,0x28f2d3805652fb5d359486dffb7d08320d403240"] = artblocksEngine;
extendCollection["1,0x64780ce53f6e966e18a22af13a2f97369580ec11"] = artblocksEngine;
extendCollection["1,0x010be6545e14f1dc50256286d9920e833f809c6a"] = artblocksEngine;
extendCollection["1,0x13aae6f9599880edbb7d144bb13f1212cee99533"] = artblocksEngine;
extendCollection["1,0xa319c382a702682129fcbf55d514e61a16f97f9c"] = artblocksEngine;
extendCollection["1,0xd10e3dee203579fcee90ed7d0bdd8086f7e53beb"] = artblocksEngine;
extendCollection["1,0x62e37f664b5945629b6549a87f8e10ed0b6d923b"] = artblocksEngine;
extendCollection["1,0x0a1bbd57033f57e7b6743621b79fcb9eb2ce3676"] = artblocksEngine;
extendCollection["1,0x942bc2d3e7a589fe5bd4a5c6ef9727dfd82f5c8a"] = artblocksEngine;
extendCollection["1,0x32d4be5ee74376e08038d652d4dc26e62c67f436"] = artblocksEngine;
extendCollection["1,0xea698596b6009a622c3ed00dd5a8b5d1cae4fc36"] = artblocksEngine;
extendCollection["1,0x8cdbd7010bd197848e95c1fd7f6e870aac9b0d3c"] = artblocksEngine;
extendCollection["5,0xe480a895de49b49e37a8f0a8bd7e07fc9844cdb9"] = artblocksEngine;
extendCollection["42161,0x47a91457a3a1f700097199fd63c039c4784384ab"] = artblocksEngine;

// Async Blueprints
extendCollection["1,0xc143bbfcdbdbed6d454803804752a064a622c1f3"] = asyncBlueprints;

// Mirage Gallery Curated
extendCollection["1,0xb7ec7bbd2d2193b47027247fc666fb342d23c4b5"] = mirageGalleryCurated;

// Superrare Shared
extendCollection["1,0xb932a70a57673d89f4acffbe830e8ed7f75fb9e0"] = superrareShared;

// Foundation
extendCollection["1,0x3b3ee1931dc30c1957379fac9aba94d1c48a5405"] = foundationShared;

// Magic Eden Override
extendCollection["137,0xef41141fbc0a7c870f30fee81c6214582dc2a494"] = magiceden;
extendCollection["137,0x72106bbe2b447ecb9b52370ddc63cfa8e553b08c"] = magiceden;
extendCollection["137,0x71ef0488d78ed490c8ffa3112fb3d7b4614f76b5"] = magiceden;
extendCollection["137,0xb58e69929d5d4d2a2a2e119b0d2bf3ee23ebfff0"] = magiceden;
extendCollection["137,0xec2b044db5f04dd2bed8f0ff2f82b1719ff64b2a"] = magiceden;
extendCollection["137,0x5456a0343308a6fd106334f06fdf57a2f4dcc892"] = magiceden;
extendCollection["137,0xadeac691a3762793aefcbfe22761614d229feaa2"] = magiceden;
extendCollection["137,0x09421f533497331e1075fdca2a16e9ce3f52312b"] = magiceden;
extendCollection["137,0x8efa4df13705422626733751f7f3927283f0ee8e"] = magiceden;
extendCollection["137,0x9dba8ea4a81eb3b3aeadbcbca9e7e88dda205a81"] = magiceden;
extendCollection["137,0xaba082d325adc08f9a1c5a8208bb5c42b3a6f978"] = magiceden;
extendCollection["137,0x5fcfae331e919d679cc3bc07c15fcc6d5c7a93cb"] = magiceden;
extendCollection["137,0xb32d51869d97218eb75e55f378205fdf658c37e1"] = magiceden;
extendCollection["137,0x5a6235e69a2a6f5008fd90b26976984fb82baed3"] = magiceden;

// Sound XYZ
soundxyz.SoundxyzArtistContracts.forEach(
  (address) => (extendCollection[`1,${address}`] = soundxyz)
);
soundxyz.SoundxyzReleaseContracts.forEach(
  (address) => (extendCollection[`1,${address}`] = soundxyz)
);
extendCollection["5,0xbe8f3dfce2fcbb6dd08a7e8109958355785c968b"] = soundxyz;

// Opensea Shared Contract
extend["1,0x495f947276749ce646f68ac8c248420045cb7b5e"] = ExtendLogicClasses.opensea;
extend["1,0x503a3039e9ce236e9a12e4008aecbb1fd8b384a3"] = ExtendLogicClasses.opensea;
extend["1,0xd78afb925a21f87fa0e35abae2aead3f70ced96b"] = ExtendLogicClasses.opensea;
extend["1,0xb6329bd2741c4e5e91e26c4e653db643e74b2b19"] = ExtendLogicClasses.opensea;
extend["1,0xd8b7cc75e22031a72d7b8393113ef2536e17bde6"] = ExtendLogicClasses.opensea;
extend["1,0x2d820afb710681580a55ca8077b57fba6dd9fd72"] = ExtendLogicClasses.opensea;
extend["1,0x0faed6ddef3773f3ee5828383aaeeaca2a94564a"] = ExtendLogicClasses.opensea;
extend["1,0x13927739076014913a3a7c207ef84c5be4780014"] = ExtendLogicClasses.opensea;
extend["1,0x7a15b36cb834aea88553de69077d3777460d73ac"] = ExtendLogicClasses.opensea;
extend["1,0x68d0f6d1d99bb830e17ffaa8adb5bbed9d6eec2e"] = ExtendLogicClasses.opensea;
extend["1,0x33eecbf908478c10614626a9d304bfe18b78dd73"] = ExtendLogicClasses.opensea;
extend["1,0x495f947276749ce646f68ac8c248420045cb7b5e"] = ExtendLogicClasses.opensea;
extend["1,0x48b17a2c46007471b3eb72d16268eaecdd1502b7"] = ExtendLogicClasses.opensea;

// Courtyard
extend["1,0xd4ac3ce8e1e14cd60666d49ac34ff2d2937cf6fa"] = courtyard;

// CyberKongz
extend["1,0x57a204aa1042f6e66dd7730813f4024114d74f37"] = cyberkongz;

// Adidas Originals
extend["1,0x28472a58a490c5e09a238847f66a68a47cc76f0f"] = adidasOriginals;

// Mutant Ape Yacht Club
extend["1,0x60e4d786628fea6478f785a6d7e704777c86a7c6"] = mutantApeYachtClub;

// Bored Ape Kennel Club
extend["1,0xba30e5f9bb24caa003e9f2f0497ad287fdf95623"] = boredApeKennelClub;

// Bored Ape Yacht Club
extend["1,0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d"] = bayc;

// Nouns
extend["1,0x9c8ff314c9bc7f6e59a9d9225fb22946427edc03"] = nouns;
extend["1,0x4b10701bfd7bfedc47d50562b76b436fbb5bdb3b"] = lilnouns;

// Chimpers
extend["1,0x80336ad7a747236ef41f47ed2c7641828a480baa"] = chimpers;

// Moonbirds
extend["1,0x23581767a106ae21c074b2276d25e5c3e136a68b"] = moonbirds;

// Sound XYZ
soundxyz.SoundxyzArtistContracts.forEach((address) => (extend[`1,${address}`] = soundxyz));
soundxyz.SoundxyzReleaseContracts.forEach((address) => (extend[`1,${address}`] = soundxyz));
extend["5,0xbe8f3dfce2fcbb6dd08a7e8109958355785c968b"] = soundxyz;

// Async Blueprints
extend["1,0xc143bbfcdbdbed6d454803804752a064a622c1f3"] = asyncBlueprints;

// tfoust
tfoust.CollectiblesCollections.forEach((c) => (extend[`137,${c}`] = tfoust));

// Feral File
extend["1,0x2a86c5466f088caebf94e071a77669bae371cd87"] = feralFile;

// Boys of Summer
extend["5,0x7ba399e03ca7598b2e6d56ba97961282edc9ad65"] = boysOfSummer;
// BrainDrops
extend["1,0xdfde78d2baec499fe18f2be74b6c287eed9511d7"] = brainDrops;

// Quantum Art
extend["1,0x46ac8540d698167fcbb9e846511beb8cf8af9bd8"] = quantumArt;

// Shredding Sassy
extend["1,0x165BD6E2ae984D9C13D94808e9A6ba2b7348c800"] = shreddingSassy;

// ArtBlocks
extend["1,0x059edd72cd353df5106d2b9cc5ab83a52287ac3a"] = artblocks;
extend["1,0xa7d8d9ef8d8ce8992df33d8b8cf4aebabd5bd270"] = artblocks;
extend["1,0x99a9b7c1116f9ceeb1652de04d5969cce509b069"] = artblocks;
extend["5,0xda62f67be7194775a75be91cbf9feedcc5776d4b"] = artblocks;
extend["5,0xb614c578062a62714c927cd8193f0b8bfb90055c"] = artblocks;

// ArtBlocks Engine
extend["1,0xbdde08bd57e5c9fd563ee7ac61618cb2ecdc0ce0"] = artblocksEngine;
extend["1,0x28f2d3805652fb5d359486dffb7d08320d403240"] = artblocksEngine;
extend["1,0x64780ce53f6e966e18a22af13a2f97369580ec11"] = artblocksEngine;
extend["1,0x010be6545e14f1dc50256286d9920e833f809c6a"] = artblocksEngine;
extend["1,0x13aae6f9599880edbb7d144bb13f1212cee99533"] = artblocksEngine;
extend["1,0xa319c382a702682129fcbf55d514e61a16f97f9c"] = artblocksEngine;
extend["1,0xd10e3dee203579fcee90ed7d0bdd8086f7e53beb"] = artblocksEngine;
extend["1,0x62e37f664b5945629b6549a87f8e10ed0b6d923b"] = artblocksEngine;
extend["1,0x0a1bbd57033f57e7b6743621b79fcb9eb2ce3676"] = artblocksEngine;
extend["1,0x942bc2d3e7a589fe5bd4a5c6ef9727dfd82f5c8a"] = artblocksEngine;
extend["1,0x32d4be5ee74376e08038d652d4dc26e62c67f436"] = artblocksEngine;
extend["1,0xea698596b6009a622c3ed00dd5a8b5d1cae4fc36"] = artblocksEngine;
extend["1,0x8cdbd7010bd197848e95c1fd7f6e870aac9b0d3c"] = artblocksEngine;
extend["5,0xe480a895de49b49e37a8f0a8bd7e07fc9844cdb9"] = artblocksEngine;
extend["42161,0x47a91457a3a1f700097199fd63c039c4784384ab"] = artblocksEngine;

// Mirage Gallery Curated
extend["1,0xb7ec7bbd2d2193b47027247fc666fb342d23c4b5"] = mirageGalleryCurated;

// Forgotten Runes
extend["1,0x521f9c7505005cfa19a8e5786a9c3c9c9f5e6f42"] = forgottenRunes;

// Forgotten Runes Warriors
extend["1,0x9690b63eb85467be5267a3603f770589ab12dc95"] = forgottenRunesWarriors;

// Forgotten Souls
extend["1,0x251b5f14a825c537ff788604ea1b58e49b70726f"] = forgottenSouls;

// Forgotten Ponies
extend["1,0xf55b615b479482440135ebf1b907fd4c37ed9420"] = forgottenPonies;

// Forgotten Runes Athenaeum
extend["1,0x7c104b4db94494688027cced1e2ebfb89642c80f"] = forgottenRunesAthenaeum;

// Loot
// extend["1,0xff9c1b15b16263c61d017ee9f65c50e4ae0113d7"] = loot;
// extend["4,0x79e2d470f950f2cf78eef41720e8ff2cf4b3cd78"] = loot;

// Goldfinch
extend["1,0x57686612c601cb5213b01aa8e80afeb24bbd01df"] = goldfinch;

// Cryptokicks IRL
extend["1,0x11708dc8a3ea69020f520c81250abb191b190110"] = cryptokicksIrl;

// Utopia Avatars
extend["1,0x5f076e995290f3f9aea85fdd06d8fae118f2b75c"] = utopiaAvatars;

// Superrare Shared
extend["1,0xb932a70a57673d89f4acffbe830e8ed7f75fb9e0"] = superrareShared;

//Foundation Shared
extend["1,0x3b3ee1931dc30c1957379fac9aba94d1c48a5405"] = foundationShared;

// Kanpai Pandas
extend["1,0xacf63e56fd08970b43401492a02f6f38b6635c91"] = kanpaiPandas;
