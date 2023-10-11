import { ObjectId } from "mongodb";

import { Router, getExpressRouter } from "./framework/router";

import { CollectionPost, CollectionUser, ExclusiveContentCollectionPost, ExclusiveContentCollectionUser, ExclusiveContentPost, Friend, Post, Profile, User, WebSession } from "./app";
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
    const createdProfile = await Profile.create(createdUser.user!._id);
    return { msg: createdUser.msg, user: createdUser.user, profile: createdProfile.profile };
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
  async getPosts(session: WebSessionDoc, author?: string) {
    // get posts
    let posts;
    if (author) {
      const id = (await User.getUserByUsername(author))._id;
      posts = await Post.getByAuthor(id);
    } else {
      posts = await Post.getPosts({});
    }
    // filter for posts that user is allowed to see
    const user = WebSession.getUser(session);
    const postVisibility = await Promise.all(posts.map(async (post) => await ExclusiveContentPost.isVisible(user, post._id)));
    const visiblePosts = posts.filter((post, i) => postVisibility[i]);
    return { msg: "Posts retreived!", posts: await Responses.posts(visiblePosts) };
  }

  @Router.get("/posts?authorsIn=[author_collection]")
  async getPostsByAuthorCollection(session: WebSessionDoc, author_collection: ObjectId) {
    // get posts
    const authors = await CollectionUser.getResourcesInCollection(new ObjectId(author_collection));
    const posts = await Post.getPosts({ author: { $in: authors.resources.map((author) => new ObjectId(author._id)) } });

    // filter for posts that user is allowed to see
    const user = WebSession.getUser(session);
    const postVisibility = await Promise.all(posts.map(async (post) => await ExclusiveContentPost.isVisible(user, post._id)));
    const visiblePosts = posts.filter((post, i) => postVisibility[i]);
    return { msg: "Posts retreived!", posts: await Responses.posts(visiblePosts) };
  }

  @Router.post("/posts")
  async createPost(session: WebSessionDoc, content: string, options?: PostOptions) {
    const user = WebSession.getUser(session);
    const created = await Post.create(user, content, options);
    await ExclusiveContentPost.makeVisible(user, created.post!._id);
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

  // POSTS - EXCLUSIVECONTENTS
  @Router.post("/exclusives/posts/:post?viewer=[viewer]")
  async makePostVisibleOne(session: WebSessionDoc, viewer: ObjectId, post: ObjectId) {
    const user = WebSession.getUser(session);
    await Post.isAuthor(user, post);
    return ExclusiveContentPost.makeVisible(new ObjectId(viewer), new ObjectId(post));
  }

  @Router.post("/exclusives/posts/:post?viewer_collection=[viewerCollection]")
  async makePostVisibleCollection(session: WebSessionDoc, viewerCollection: ObjectId, post: ObjectId) {
    const user = WebSession.getUser(session);
    await Post.isAuthor(user, post);
    const viewers = await CollectionUser.getResourcesInCollection(new ObjectId(viewerCollection));
    return ExclusiveContentPost.makeVisibleToMany(
      viewers.resources.map((user) => user._id),
      new ObjectId(post),
    );
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
    await ExclusiveContentCollectionUser.makeVisible(user, created.collection!._id);
    return { msg: created.msg, collection: await Responses.collection(created.collection) };
  }

  @Router.get("/user_collections/:username")
  async getUserCollections(session: WebSessionDoc, username: string) {
    const currentUser = WebSession.getUser(session);
    const userId = (await User.getUserByUsername(username))._id;
    const resp = await CollectionUser.getCollectionsByOwner(userId);
    // fitler for visible collections
    const collectionVisibility = await Promise.all(resp.collections.map(async (c) => await ExclusiveContentCollectionUser.isVisible(currentUser, c._id)));
    const visibleCollections = resp.collections.filter((post, i) => collectionVisibility[i]);
    return { msg: resp.msg, collections: await Responses.collections(visibleCollections) };
  }

  @Router.post("/user_collections/:collection/users")
  async addToUserCollection(session: WebSessionDoc, collection: ObjectId, user: ObjectId, note: string) {
    const currentUser = WebSession.getUser(session);
    return await CollectionUser.labelResource(currentUser, new ObjectId(collection), new ObjectId(user), note);
  }

  @Router.get("/user_collections/:collection/users")
  async getUsersInCollection(collection: ObjectId) {
    const labelledUsers = await CollectionUser.getResourcesInCollection(new ObjectId(collection));
    const userIds = labelledUsers.resources.map((labelledUser) => new ObjectId(labelledUser.resource));
    return await User.getUsersById(userIds);
  }

  @Router.get("/user_collections/user/:id")
  async getUserAssociatedCollections(user: ObjectId) {
    const resp = await CollectionUser.getAssociatedCollections(new ObjectId(user));
    return { msg: resp.msg, collections: await Responses.collections(resp.collections) };
  }

  // COLLECTIONS - USERS - EXCLUSIVECONTENTS
  @Router.post("/exclusives/user_collections/:collection?viewer=[viewer]")
  async makeCollectionUserVisibleOne(session: WebSessionDoc, viewer: ObjectId, collection: ObjectId) {
    const user = WebSession.getUser(session);
    await CollectionUser.isOwner(user, new ObjectId(collection));
    return ExclusiveContentCollectionUser.makeVisible(new ObjectId(viewer), new ObjectId(collection));
  }

  @Router.post("/exclusives/user_collections/:collection?viewer_collection=[viewerCollection]")
  async makeCollectionUserVisibleCollection(session: WebSessionDoc, viewerCollection: ObjectId, collection: ObjectId) {
    const user = WebSession.getUser(session);
    await CollectionUser.isOwner(user, new ObjectId(collection));
    const viewers = await CollectionUser.getResourcesInCollection(new ObjectId(viewerCollection));
    return ExclusiveContentCollectionUser.makeVisibleToMany(
      viewers.resources.map((user) => user._id),
      new ObjectId(collection),
    );
  }

  // COLLECTIONS - POSTS
  @Router.post("/post_collections")
  async createPostCollection(session: WebSessionDoc, label: string) {
    const user = WebSession.getUser(session);
    const created = await CollectionPost.create(user, label);
    await ExclusiveContentCollectionPost.makeVisible(user, created.collection!._id);
    return { msg: created.msg, collection: await Responses.collection(created.collection) };
  }

  @Router.get("/post_collections/:username")
  async getPostCollections(session: WebSessionDoc, username: string) {
    const currentUser = WebSession.getUser(session);
    const userId = (await User.getUserByUsername(username))._id;
    const resp = await CollectionPost.getCollectionsByOwner(userId);
    // filter for visible collections
    const collectionVisibility = await Promise.all(resp.collections.map(async (c) => await ExclusiveContentCollectionPost.isVisible(currentUser, c._id)));
    const visibleCollections = resp.collections.filter((post, i) => collectionVisibility[i]);
    return { msg: resp.msg, collections: await Responses.collections(visibleCollections) };
  }

  @Router.post("/post_collections/:collection/posts")
  async addToPostCollection(session: WebSessionDoc, collection: ObjectId, post: ObjectId, note: string) {
    const user = WebSession.getUser(session);
    return await CollectionPost.labelResource(user, new ObjectId(collection), new ObjectId(post), note);
  }

  @Router.get("/post_collections/:collection/posts")
  async getPostsInCollection(collection: ObjectId) {
    const labelledPosts = await CollectionPost.getResourcesInCollection(new ObjectId(collection));
    const postIds = labelledPosts.resources.map((labelledPost) => new ObjectId(labelledPost.resource));
    return { msg: "Posts in collection retreived!", posts: await Responses.posts(await Post.getPosts({ _id: { $in: postIds } })) };
  }

  @Router.get("/post_collections/post/:id")
  async getPostAssociatedCollections(post: ObjectId) {
    const resp = await CollectionPost.getAssociatedCollections(new ObjectId(post));
    return { msg: resp.msg, collections: await Responses.collections(resp.collections) };
  }

  // COLLECTIONS - POSTS - EXCLUSIVECONTENTS
  @Router.post("/exclusives/post_collections/:collection?viewer=[viewer]")
  async makeCollectionPostVisibleOne(session: WebSessionDoc, viewer: ObjectId, collection: ObjectId) {
    const user = WebSession.getUser(session);
    await CollectionPost.isOwner(user, new ObjectId(collection));
    return ExclusiveContentCollectionPost.makeVisible(new ObjectId(viewer), new ObjectId(collection));
  }

  @Router.post("/exclusives/post_collections/:collection?viewer_collection=[viewerCollection]")
  async makeCollectionPostVisibleCollection(session: WebSessionDoc, viewerCollection: ObjectId, collection: ObjectId) {
    const user = WebSession.getUser(session);
    await CollectionPost.isOwner(user, new ObjectId(collection));
    const viewers = await CollectionUser.getResourcesInCollection(new ObjectId(viewerCollection));
    return ExclusiveContentCollectionPost.makeVisibleToMany(
      viewers.resources.map((user) => user._id),
      new ObjectId(collection),
    );
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
    await Profile.isUser(user, new ObjectId(_id));
    return await Profile.editName(new ObjectId(_id), name);
  }

  @Router.patch("/profiles/:_id/bio")
  async updateProfileBio(session: WebSessionDoc, _id: ObjectId, bio: string) {
    const user = WebSession.getUser(session);
    await Profile.isUser(user, new ObjectId(_id));
    return await Profile.editBio(new ObjectId(_id), bio);
  }
}

export default getExpressRouter(new Routes());
