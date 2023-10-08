import { ObjectId } from "mongodb";

import { Router, getExpressRouter } from "./framework/router";

import { CollectionPost, CollectionUser, Friend, Post, Profile, User, WebSession } from "./app";
import { PostDoc, PostOptions } from "./concepts/post";
import { UserDoc } from "./concepts/user";
import { WebSessionDoc } from "./concepts/websession";
import Responses from "./responses";

class Routes {
  @Router.get("/session")
  async getSessionUser(session: WebSessionDoc) {
    const user = WebSession.getUser(session);
    return await User.getUserById(user);
  }

  @Router.get("/users")
  async getUsers() {
    return await User.getUsers();
  }

  @Router.get("/users/:username")
  async getUser(username: string) {
    return await User.getUserByUsername(username);
  }

  @Router.post("/users")
  async createUser(session: WebSessionDoc, username: string, password: string) {
    WebSession.isLoggedOut(session);
    const createdUser = await User.create(username, password);

    const id = (await User.getUserByUsername(username))._id;
    const createdProfile = await Profile.create(id);

    return { msg: createdUser.msg + createdProfile.msg, user: createdUser.user, profile: createdProfile.profile };
  }

  @Router.patch("/users")
  async updateUser(session: WebSessionDoc, update: Partial<UserDoc>) {
    const user = WebSession.getUser(session);
    return await User.update(user, update);
  }

  @Router.delete("/users")
  async deleteUser(session: WebSessionDoc) {
    const user = WebSession.getUser(session);
    WebSession.end(session);
    return await User.delete(user);
  }

  @Router.post("/login")
  async logIn(session: WebSessionDoc, username: string, password: string) {
    const u = await User.authenticate(username, password);
    WebSession.start(session, u._id);
    return { msg: "Logged in!" };
  }

  @Router.post("/logout")
  async logOut(session: WebSessionDoc) {
    WebSession.end(session);
    return { msg: "Logged out!" };
  }

  @Router.get("/posts")
  async getPosts(author?: string) {
    let posts;
    if (author) {
      const id = (await User.getUserByUsername(author))._id;
      posts = await Post.getByAuthor(id);
    } else {
      posts = await Post.getPosts({});
    }
    return Responses.posts(posts);
  }

  @Router.post("/posts")
  async createPost(session: WebSessionDoc, content: string, options?: PostOptions) {
    const user = WebSession.getUser(session);
    const created = await Post.create(user, content, options);
    return { msg: created.msg, post: await Responses.post(created.post) };
  }

  @Router.patch("/posts/:_id")
  async updatePost(session: WebSessionDoc, _id: ObjectId, update: Partial<PostDoc>) {
    const user = WebSession.getUser(session);
    await Post.isAuthor(user, _id);
    return await Post.update(_id, update);
  }

  @Router.delete("/posts/:_id")
  async deletePost(session: WebSessionDoc, _id: ObjectId) {
    const user = WebSession.getUser(session);
    await Post.isAuthor(user, _id);
    return Post.delete(_id);
  }

  @Router.get("/friends")
  async getFriends(session: WebSessionDoc) {
    const user = WebSession.getUser(session);
    return await User.idsToUsernames(await Friend.getFriends(user));
  }

  @Router.delete("/friends/:friend")
  async removeFriend(session: WebSessionDoc, friend: string) {
    const user = WebSession.getUser(session);
    const friendId = (await User.getUserByUsername(friend))._id;
    return await Friend.removeFriend(user, friendId);
  }

  @Router.get("/friend/requests")
  async getRequests(session: WebSessionDoc) {
    const user = WebSession.getUser(session);
    return await Responses.friendRequests(await Friend.getRequests(user));
  }

  @Router.post("/friend/requests/:to")
  async sendFriendRequest(session: WebSessionDoc, to: string) {
    const user = WebSession.getUser(session);
    const toId = (await User.getUserByUsername(to))._id;
    return await Friend.sendRequest(user, toId);
  }

  @Router.delete("/friend/requests/:to")
  async removeFriendRequest(session: WebSessionDoc, to: string) {
    const user = WebSession.getUser(session);
    const toId = (await User.getUserByUsername(to))._id;
    return await Friend.removeRequest(user, toId);
  }

  @Router.put("/friend/accept/:from")
  async acceptFriendRequest(session: WebSessionDoc, from: string) {
    const user = WebSession.getUser(session);
    const fromId = (await User.getUserByUsername(from))._id;
    return await Friend.acceptRequest(fromId, user);
  }

  @Router.put("/friend/reject/:from")
  async rejectFriendRequest(session: WebSessionDoc, from: string) {
    const user = WebSession.getUser(session);
    const fromId = (await User.getUserByUsername(from))._id;
    return await Friend.rejectRequest(fromId, user);
  }

  // COLLECTIONS - USERS
  @Router.post("/user_collections")
  async createUserCollection(session: WebSessionDoc, label: string) {
    const user = WebSession.getUser(session);
    const created = await CollectionUser.create(user, label);
    return { msg: created.msg, collection: await Responses.collection(created.collection) };
  }

  @Router.get("/user_collections")
  async getUserCollections(session: WebSessionDoc, user?: string) {
    let resp;
    if (user) {
      const id = (await User.getUserByUsername(user))._id;
      resp = await CollectionUser.getCollectionsByOwner(id);
    } else {
      const currentUser = WebSession.getUser(session);
      resp = await CollectionUser.getCollectionsByOwner(currentUser);
    }
    return { msg: resp.msg, collections: await Responses.collections(resp.collections) };
  }

  @Router.post("/user_collections/:collection/users")
  async addToUserCollection(session: WebSessionDoc, collection: ObjectId, user: ObjectId, note: string) {
    const currentUser = WebSession.getUser(session);
    return await CollectionUser.labelResource(currentUser, collection, user, note);
  }

  @Router.get("/user_collections/:collection/users")
  async getUsersInCollection(collection: ObjectId) {
    const labelledUsers = await CollectionUser.getResourcesInCollection(collection);
    const userIds = labelledUsers.resources.map((labelledUser) => new ObjectId(labelledUser.resource));
    return await User.getUsersById(userIds);
  }

  @Router.get("/user_collections/user/:id")
  async getUserAssociatedCollections(user: ObjectId) {
    const resp = await CollectionUser.getAssociatedCollections(user);
    console.log(resp);
    return { msg: resp.msg, collections: await Responses.collections(resp.collections) };
  }

  // COLLECTIONS - POSTS
  @Router.post("/post_collections")
  async createPostCollection(session: WebSessionDoc, label: string) {
    const user = WebSession.getUser(session);
    const created = await CollectionPost.create(user, label);
    return { msg: created.msg, collection: await Responses.collection(created.collection) };
  }

  @Router.get("/post_collections")
  async getPostCollections(session: WebSessionDoc, user?: string) {
    let resp;
    if (user) {
      const id = (await User.getUserByUsername(user))._id;
      resp = await CollectionPost.getCollectionsByOwner(id);
    } else {
      const currentUser = WebSession.getUser(session);
      resp = await CollectionPost.getCollectionsByOwner(currentUser);
    }
    return { msg: resp.msg, collections: await Responses.collections(resp.collections) };
  }

  @Router.post("/post_collections/:collection/posts")
  async addToPostCollection(session: WebSessionDoc, collection: ObjectId, post: ObjectId, note: string) {
    const user = WebSession.getUser(session);
    return await CollectionPost.labelResource(user, collection, post, note);
  }

  @Router.get("/post_collections/:collection/posts")
  async getPostsInCollection(collection: ObjectId) {
    const labelledPosts = await CollectionPost.getResourcesInCollection(collection);
    const postIds = labelledPosts.resources.map((labelledPost) => new ObjectId(labelledPost.resource));
    return await Responses.posts(await Post.getPosts({ _id: { $in: postIds } }));
  }

  @Router.get("/post_collections/post/:id")
  async getPostAssociatedCollections(post: ObjectId) {
    const resp = await CollectionPost.getAssociatedCollections(post);
    console.log(resp);
    return { msg: resp.msg, collections: await Responses.collections(resp.collections) };
  }

  // PROFILES
  @Router.get("/profiles")
  async getProfileByUserName(session: WebSessionDoc, username?: string) {
    if (username) {
      const id = (await User.getUserByUsername(username))._id;
      return await Profile.getByUser(id);
    } else {
      const currentUser = WebSession.getUser(session);
      return await Profile.getByUser(currentUser);
    }
  }

  @Router.patch("/profiles/:_id/name")
  async updateProfileName(session: WebSessionDoc, _id: ObjectId, name: string) {
    const user = WebSession.getUser(session);
    await Profile.isUser(user, _id);
    return await Profile.editName(_id, name);
  }

  @Router.patch("/profiles/:_id/bio")
  async updateProfileBio(session: WebSessionDoc, _id: ObjectId, bio: string) {
    const user = WebSession.getUser(session);
    await Profile.isUser(user, _id);
    return await Profile.editBio(_id, bio);
  }
}

export default getExpressRouter(new Routes());
