import CollectionConcept from "./concepts/collection";
import ExclusiveContentConcept from "./concepts/exclusiveContent";
import FriendConcept from "./concepts/friend";
import PostConcept from "./concepts/post";
import ProfileConcept from "./concepts/profile";
import UserConcept from "./concepts/user";
import WebSessionConcept from "./concepts/websession";

// App Definition using concepts
export const WebSession = new WebSessionConcept();
export const User = new UserConcept();
export const Post = new PostConcept();
export const Friend = new FriendConcept();
export const CollectionPost = new CollectionConcept("collections_of_posts", "labelled_posts");
export const CollectionUser = new CollectionConcept("collections_of_users", "labelled_users");
export const ExclusiveContentPost = new ExclusiveContentConcept("exclusive_posts");
export const ExclusiveContentCollectionPost = new ExclusiveContentConcept("exclusive_collections_of_posts");
export const ExclusiveContentCollectionUser = new ExclusiveContentConcept("exclusive_collections_of_users");
export const Profile = new ProfileConcept();
