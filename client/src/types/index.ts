export interface User {
  id: number;
  openId: string;
  name: string | null;
  email: string | null;
  loginMethod: string | null;
  role: "user" | "admin";
  createdAt: Date;
  updatedAt: Date;
  lastSignedIn: Date;
}

export interface Resource {
  id: number;
  userId: number;
  collectionId: number | null;
  title: string;
  description: string | null;
  contentType: "link" | "text";
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Collection {
  id: number;
  userId: number;
  name: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Tag {
  id: number;
  userId: number;
  name: string;
  createdAt: Date;
}

export interface ResourceTag {
  id: number;
  resourceId: number;
  tagId: number;
}
