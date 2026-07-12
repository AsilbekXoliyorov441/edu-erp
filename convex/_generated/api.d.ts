/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as auth from "../auth.js";
import type * as authActions from "../authActions.js";
import type * as backup from "../backup.js";
import type * as coinEntries from "../coinEntries.js";
import type * as gifts from "../gifts.js";
import type * as groups from "../groups.js";
import type * as lessons from "../lessons.js";
import type * as lib_authz from "../lib/authz.js";
import type * as lib_passwords from "../lib/passwords.js";
import type * as lib_scoping from "../lib/scoping.js";
import type * as migrations from "../migrations.js";
import type * as quiz from "../quiz.js";
import type * as students from "../students.js";
import type * as studentsActions from "../studentsActions.js";
import type * as teachers from "../teachers.js";
import type * as teachersActions from "../teachersActions.js";
import type * as testQuestions from "../testQuestions.js";
import type * as tests from "../tests.js";
import type * as transactions from "../transactions.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  authActions: typeof authActions;
  backup: typeof backup;
  coinEntries: typeof coinEntries;
  gifts: typeof gifts;
  groups: typeof groups;
  lessons: typeof lessons;
  "lib/authz": typeof lib_authz;
  "lib/passwords": typeof lib_passwords;
  "lib/scoping": typeof lib_scoping;
  migrations: typeof migrations;
  quiz: typeof quiz;
  students: typeof students;
  studentsActions: typeof studentsActions;
  teachers: typeof teachers;
  teachersActions: typeof teachersActions;
  testQuestions: typeof testQuestions;
  tests: typeof tests;
  transactions: typeof transactions;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
