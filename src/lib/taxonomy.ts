import collectionData from "../../content/collections.json" with { type: "json" };
import type { CollectionRecord } from "./schema.js";

export type Collection = CollectionRecord;
export const collections: Collection[] = collectionData;
export const collectionById = new Map(collections.map((item) => [item.id, item]));
