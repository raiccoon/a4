import { ObjectId } from "mongodb";

import DocCollection, { BaseDoc } from "../framework/doc";

export interface ExclusiveContentDoc extends BaseDoc {
  viewer: ObjectId;
  content: ObjectId;
}

export default class ExclusiveContentConcept {
  public readonly exclusiveContents;

  constructor(collectionName: string) {
    this.exclusiveContents = new DocCollection<ExclusiveContentDoc>(collectionName);
  }

  async makeVisible(viewer: ObjectId, content: ObjectId) {
    const _id = await this.exclusiveContents.createOne({ viewer, content });
    return { msg: "Made content visible to viewer!", ExclusiveContent: await this.exclusiveContents.readOne({ _id }) };
  }

  async makeInvisible(viewer: ObjectId, content: ObjectId) {
    const maybeExclusiveContent = await this.exclusiveContents.popOne({ viewer, content });
    if (maybeExclusiveContent === null) {
      return { msg: "Content already invisible!" };
    }
    return { msg: "Made content invisible to viewer!", ExclusiveContent: maybeExclusiveContent };
  }

  async isVisible(viewer: ObjectId, content: ObjectId) {
    const visibility = await this.exclusiveContents.readOne({ viewer, content });
    return !(visibility === null);
  }
}
