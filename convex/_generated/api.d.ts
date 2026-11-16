/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as attendance from "../attendance.js";
import type * as auth from "../auth.js";
import type * as authActions from "../authActions.js";
import type * as backup from "../backup.js";
import type * as centers from "../centers.js";
import type * as coinEntries from "../coinEntries.js";
import type * as crons from "../crons.js";
import type * as games from "../games.js";
import type * as giftOrders from "../giftOrders.js";
import type * as giftOrdersActions from "../giftOrdersActions.js";
import type * as gifts from "../gifts.js";
import type * as groups from "../groups.js";
import type * as homework from "../homework.js";
import type * as homeworkActions from "../homeworkActions.js";
import type * as incidents from "../incidents.js";
import type * as lessonQuiz from "../lessonQuiz.js";
import type * as lessons from "../lessons.js";
import type * as lib_authz from "../lib/authz.js";
import type * as lib_curriculum_build from "../lib/curriculum/build.js";
import type * as lib_curriculum_css from "../lib/curriculum/css.js";
import type * as lib_curriculum_html from "../lib/curriculum/html.js";
import type * as lib_curriculum_index from "../lib/curriculum/index.js";
import type * as lib_curriculum_javascript from "../lib/curriculum/javascript.js";
import type * as lib_curriculum_python from "../lib/curriculum/python.js";
import type * as lib_learningLevel from "../lib/learningLevel.js";
import type * as lib_notify from "../lib/notify.js";
import type * as lib_optionOrder from "../lib/optionOrder.js";
import type * as lib_passwordVault from "../lib/passwordVault.js";
import type * as lib_passwords from "../lib/passwords.js";
import type * as lib_presetTests from "../lib/presetTests.js";
import type * as lib_scoping from "../lib/scoping.js";
import type * as lib_studentStats from "../lib/studentStats.js";
import type * as migrations from "../migrations.js";
import type * as monthlyGoal from "../monthlyGoal.js";
import type * as notifications from "../notifications.js";
import type * as quiz from "../quiz.js";
import type * as studentStats from "../studentStats.js";
import type * as students from "../students.js";
import type * as studentsActions from "../studentsActions.js";
import type * as teachers from "../teachers.js";
import type * as teachersActions from "../teachersActions.js";
import type * as testAssignments from "../testAssignments.js";
import type * as testQuestions from "../testQuestions.js";
import type * as tests from "../tests.js";
import type * as town from "../town.js";
import type * as transactions from "../transactions.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  attendance: typeof attendance;
  auth: typeof auth;
  authActions: typeof authActions;
  backup: typeof backup;
  centers: typeof centers;
  coinEntries: typeof coinEntries;
  crons: typeof crons;
  games: typeof games;
  giftOrders: typeof giftOrders;
  giftOrdersActions: typeof giftOrdersActions;
  gifts: typeof gifts;
  groups: typeof groups;
  homework: typeof homework;
  homeworkActions: typeof homeworkActions;
  incidents: typeof incidents;
  lessonQuiz: typeof lessonQuiz;
  lessons: typeof lessons;
  "lib/authz": typeof lib_authz;
  "lib/curriculum/build": typeof lib_curriculum_build;
  "lib/curriculum/css": typeof lib_curriculum_css;
  "lib/curriculum/html": typeof lib_curriculum_html;
  "lib/curriculum/index": typeof lib_curriculum_index;
  "lib/curriculum/javascript": typeof lib_curriculum_javascript;
  "lib/curriculum/python": typeof lib_curriculum_python;
  "lib/learningLevel": typeof lib_learningLevel;
  "lib/notify": typeof lib_notify;
  "lib/optionOrder": typeof lib_optionOrder;
  "lib/passwordVault": typeof lib_passwordVault;
  "lib/passwords": typeof lib_passwords;
  "lib/presetTests": typeof lib_presetTests;
  "lib/scoping": typeof lib_scoping;
  "lib/studentStats": typeof lib_studentStats;
  migrations: typeof migrations;
  monthlyGoal: typeof monthlyGoal;
  notifications: typeof notifications;
  quiz: typeof quiz;
  studentStats: typeof studentStats;
  students: typeof students;
  studentsActions: typeof studentsActions;
  teachers: typeof teachers;
  teachersActions: typeof teachersActions;
  testAssignments: typeof testAssignments;
  testQuestions: typeof testQuestions;
  tests: typeof tests;
  town: typeof town;
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
