#!/usr/bin/env node
/**
 * Builds the allowlist Merkle tree and writes the per-address proofs the
 * mint page reads at build time.
 *
 *   npm run allowlist:build                       # data/allowlist.json
 *   npm run allowlist:build -- path/to/list.json   # explicit input
 *
 * Input is a JSON array of addresses. Output is two files:
 *
 *   src/data/allowlist-proofs.generated.json   { [lowercased address]: string[] }
 *     Bundled into the app so the mint page can look up a connected
 *     wallet's proof with no network round trip.
 *
 *   allowlist-root.txt   the Merkle root
 *     Not consumed by the app. Feed it to
 *     `HoodSharesCollection.setAllowlistMerkleRoot` by hand — the contract
 *     owner is a multisig, so this is never an automated step.
 *
 * Leaf encoding has to match the contract exactly:
 * `keccak256(bytes.concat(keccak256(abi.encode(msg.sender))))`. That is
 * OpenZeppelin's standard double-hashed single-value leaf, which is what
 * `StandardMerkleTree.of(addresses, ["address"])` produces — so this script
 * defers to that library rather than reimplementing the hashing.
 */

import { StandardMerkleTree } from "@openzeppelin/merkle-tree";
import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { isAddress } from "viem";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const OUTPUT = resolve(ROOT, "src/data/allowlist-proofs.generated.json");
const ROOT_FILE = resolve(ROOT, "allowlist-root.txt");

const inputPath = resolve(ROOT, process.argv[2] ?? "data/allowlist.json");

let raw;
try {
  raw = JSON.parse(await readFile(inputPath, "utf8"));
} catch {
  console.error(
    `Could not read ${inputPath.replace(ROOT + "/", "")}.\n` +
      `Copy data/allowlist.sample.json to data/allowlist.json (gitignored — it's a real address list) and fill it in, or pass a path explicitly.`,
  );
  process.exit(1);
}

const addresses = [...new Set(raw.map((a) => a.toLowerCase()))];
const invalid = addresses.filter((a) => !isAddress(a));
if (invalid.length > 0) {
  console.error(`Not a valid address: ${invalid.join(", ")}`);
  process.exit(1);
}

if (addresses.length === 0) {
  console.error("Allowlist is empty — nothing to build.");
  process.exit(1);
}

const tree = StandardMerkleTree.of(
  addresses.map((a) => [a]),
  ["address"],
);

const proofs = {};
for (const [index, [address]] of tree.entries()) {
  proofs[address] = tree.getProof(index);
}

await writeFile(OUTPUT, JSON.stringify(proofs, null, 2) + "\n");
await writeFile(ROOT_FILE, tree.root + "\n");

console.log(`${addresses.length} addresses`);
console.log(`Root:  ${tree.root}`);
console.log(`Wrote ${OUTPUT.replace(ROOT + "/", "")}`);
console.log(`Wrote ${ROOT_FILE.replace(ROOT + "/", "")}`);
console.log(`\nStill required: owner (multisig) calls setAllowlistMerkleRoot(${tree.root}).`);
