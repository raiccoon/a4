import { ObjectId } from "mongodb";

import DocCollection, { BaseDoc } from "../framework/doc";
import { NotAllowedError, NotFoundError } from "./errors";

export interface CollectionDoc extends BaseDoc {
  owner: ObjectId;
  label: string;
}

export interface LabelledResourceDoc extends BaseDoc {
  collection: ObjectId;
  resource: ObjectId;
  note: string;
}

export default class CollectionConcept {
  public readonly collections;
  public readonly labelledResources;

  constructor(collectionsOf: string, labelledResourcesType: string) {
    this.collections = new DocCollection<CollectionDoc>(collectionsOf);
    this.labelledResources = new DocCollection<LabelledResourceDoc>(labelledResourcesType);
  }

  async create(owner: ObjectId, label: string) {
    await this.isLabelUnique(owner, label);
    const _id = await this.collections.createOne({ owner, label });
    return { msg: "Collection created successfully!", collection: await this.collections.readOne({ _id }) };
  }

  async getCollectionsByOwner(owner: ObjectId) {
    const collections = await this.collections.readMany({ owner: owner });
    return { msg: "Collections retrieved successfully!", collections };
  }

  async labelResource(user: ObjectId, collection: ObjectId, resource: ObjectId, note: string) {
    await this.isOwner(user, collection);
    await this.isNotInCollection(resource, collection);
    await this.labelledResources.createOne({ collection, resource, note });
    return { msg: "Sucessfully added to collection!" };
  }

  async getResourcesInCollection(collection: ObjectId) {
    await this.collectionExists(collection);
    const resources = await this.labelledResources.readMany({ collection });
    return { msg: "Resources in collection retrieved", resources };
  }

  async getAssociatedCollections(resource: ObjectId) {
    const collectionPairs = await this.labelledResources.readMany({ resource });
    const collectionIds = collectionPairs.map((pair) => pair.collection);
    const collections = await this.collections.readMany({ _id: { $in: collectionIds } });
    return { msg: "Associated collections retrieved!", collections };
  }

  // Helpers
  private async collectionExists(_id: ObjectId) {
    const maybeCollection = this.collections.readOne({ _id });
    if (maybeCollection === null) {
      throw new NotFoundError("Collection not found!");
    }
  }

  async isOwner(user: ObjectId, collection: ObjectId) {
    const maybeCollection = await this.collections.readOne({ _id: collection });
    if (!maybeCollection) {
      throw new NotFoundError(`Collection ${collection} does not exist!`);
    }
    if (maybeCollection.owner.toString() !== user.toString()) {
      throw new NotAllowedError("{0} is not the owner of and can't edit collection {1}", user, collection);
    }
  }

  private async isNotInCollection(resource: ObjectId, collection: ObjectId) {
    const maybeLabelledResource = await this.labelledResources.readOne({ collection, resource });
    if (maybeLabelledResource !== null) {
      throw new NotAllowedError("{0} is already in collection {1}", resource, collection);
    }
  }

  private async isLabelUnique(user: ObjectId, label: string) {
    if (await this.collections.readOne({ owner: user, label: label })) {
      console.log(await this.collections.readOne({ owner: user, label: label }));
      throw new NotAllowedError(`Collection named ${label} owned by ${user} already exists!`);
    }
  }
}
