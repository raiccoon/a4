import { ObjectId } from "mongodb";

import DocCollection, { BaseDoc } from "../framework/doc";
import { NotAllowedError, NotFoundError } from "./errors";

export interface ProfileDoc extends BaseDoc {
  user: ObjectId;
  name: string;
  bio: string;
}

export default class ProfileConcept {
  public readonly profiles = new DocCollection<ProfileDoc>("profiles");

  async create(user: ObjectId) {
    const _id = await this.profiles.createOne({ user, name: "", bio: "" });
    return { msg: "Profile created successfully!", profile: await this.profiles.readOne({ _id }) };
  }

  async getByUser(user: ObjectId) {
    return { msg: "Profile retreived successfully!", profile: await this.profiles.readOne({ user: user }) };
  }

  async editName(_id: ObjectId, name: string) {
    await this.profiles.updateOne({ _id }, { name: name });
    return { msg: "Profile name successfully updated!" };
  }

  async editBio(_id: ObjectId, bio: string) {
    await this.profiles.updateOne({ _id }, { bio: bio });
    return { msg: "Profile bio successfully updated!" };
  }

  async isUser(user: ObjectId, _id: ObjectId) {
    const profile = await this.profiles.readOne({ _id });
    if (!profile) {
      throw new NotFoundError(`Profile ${_id} does not exist!`);
    }
    if (profile.user.toString() !== user.toString()) {
      throw new ProfileUserNotMatchError(user, _id);
    }
  }
}

export class ProfileUserNotMatchError extends NotAllowedError {
  constructor(
    public readonly user: ObjectId,
    public readonly _id: ObjectId,
  ) {
    super("{0} is not the user of profile {1}!", user, _id);
  }
}
