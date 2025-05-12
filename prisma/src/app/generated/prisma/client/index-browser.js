
Object.defineProperty(exports, "__esModule", { value: true });

const {
  Decimal,
  objectEnumValues,
  makeStrictEnum,
  Public,
  getRuntime,
  skip
} = require('./runtime/index-browser.js')


const Prisma = {}

exports.Prisma = Prisma
exports.$Enums = {}

/**
 * Prisma Client JS version: 6.6.0
 * Query Engine version: f676762280b54cd07c770017ed3711ddde35f37a
 */
Prisma.prismaVersion = {
  client: "6.6.0",
  engine: "f676762280b54cd07c770017ed3711ddde35f37a"
}

Prisma.PrismaClientKnownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientKnownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)};
Prisma.PrismaClientUnknownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientUnknownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientRustPanicError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientRustPanicError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientInitializationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientInitializationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientValidationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientValidationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.Decimal = Decimal

/**
 * Re-export of sql-template-tag
 */
Prisma.sql = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`sqltag is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.empty = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`empty is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.join = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`join is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.raw = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`raw is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.validator = Public.validator

/**
* Extensions
*/
Prisma.getExtensionContext = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.getExtensionContext is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.defineExtension = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.defineExtension is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}

/**
 * Shorthand utilities for JSON filtering
 */
Prisma.DbNull = objectEnumValues.instances.DbNull
Prisma.JsonNull = objectEnumValues.instances.JsonNull
Prisma.AnyNull = objectEnumValues.instances.AnyNull

Prisma.NullTypes = {
  DbNull: objectEnumValues.classes.DbNull,
  JsonNull: objectEnumValues.classes.JsonNull,
  AnyNull: objectEnumValues.classes.AnyNull
}



/**
 * Enums
 */

exports.Prisma.TransactionIsolationLevel = makeStrictEnum({
  ReadUncommitted: 'ReadUncommitted',
  ReadCommitted: 'ReadCommitted',
  RepeatableRead: 'RepeatableRead',
  Serializable: 'Serializable'
});

exports.Prisma.UserScalarFieldEnum = {
  id: 'id',
  name: 'name',
  email: 'email',
  emailVerified: 'emailVerified',
  image: 'image',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  username: 'username',
  displayUsername: 'displayUsername',
  lang: 'lang',
  twoFactorEnabled: 'twoFactorEnabled',
  stripeCustomerId: 'stripeCustomerId',
  activeOrganizationId: 'activeOrganizationId'
};

exports.Prisma.SessionScalarFieldEnum = {
  id: 'id',
  expiresAt: 'expiresAt',
  token: 'token',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  ipAddress: 'ipAddress',
  userAgent: 'userAgent',
  userId: 'userId',
  activeOrganizationId: 'activeOrganizationId'
};

exports.Prisma.AccountScalarFieldEnum = {
  id: 'id',
  accountId: 'accountId',
  providerId: 'providerId',
  userId: 'userId',
  accessToken: 'accessToken',
  refreshToken: 'refreshToken',
  idToken: 'idToken',
  accessTokenExpiresAt: 'accessTokenExpiresAt',
  refreshTokenExpiresAt: 'refreshTokenExpiresAt',
  scope: 'scope',
  password: 'password',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.VerificationScalarFieldEnum = {
  id: 'id',
  identifier: 'identifier',
  value: 'value',
  expiresAt: 'expiresAt',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.TwoFactorScalarFieldEnum = {
  id: 'id',
  secret: 'secret',
  backupCodes: 'backupCodes',
  userId: 'userId'
};

exports.Prisma.SubscriptionScalarFieldEnum = {
  id: 'id',
  plan: 'plan',
  referenceId: 'referenceId',
  stripeCustomerId: 'stripeCustomerId',
  stripeSubscriptionId: 'stripeSubscriptionId',
  status: 'status',
  periodStart: 'periodStart',
  periodEnd: 'periodEnd',
  cancelAtPeriodEnd: 'cancelAtPeriodEnd',
  seats: 'seats',
  trialStart: 'trialStart',
  trialEnd: 'trialEnd',
  billing: 'billing',
  price: 'price',
  autoRenew: 'autoRenew'
};

exports.Prisma.TaskScalarFieldEnum = {
  id: 'id',
  title: 'title',
  description: 'description',
  priority: 'priority',
  category: 'category',
  completed: 'completed',
  scheduled: 'scheduled',
  date: 'date',
  startTime: 'startTime',
  endTime: 'endTime',
  duration: 'duration',
  tags: 'tags',
  status: 'status',
  order: 'order',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  userId: 'userId',
  parentId: 'parentId',
  projectId: 'projectId',
  teamId: 'teamId'
};

exports.Prisma.TaskResourceScalarFieldEnum = {
  id: 'id',
  name: 'name',
  type: 'type',
  category: 'category',
  url: 'url',
  taskId: 'taskId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.TaskAssignmentScalarFieldEnum = {
  id: 'id',
  taskId: 'taskId',
  userId: 'userId',
  createdAt: 'createdAt'
};

exports.Prisma.FriendshipScalarFieldEnum = {
  id: 'id',
  status: 'status',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  senderId: 'senderId',
  receiverId: 'receiverId'
};

exports.Prisma.ChatScalarFieldEnum = {
  id: 'id',
  name: 'name',
  type: 'type',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ChatParticipantScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  chatId: 'chatId',
  role: 'role',
  joinedAt: 'joinedAt'
};

exports.Prisma.MessageScalarFieldEnum = {
  id: 'id',
  content: 'content',
  type: 'type',
  fileUrl: 'fileUrl',
  fileName: 'fileName',
  fileSize: 'fileSize',
  senderId: 'senderId',
  chatId: 'chatId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  status: 'status',
  replyToId: 'replyToId'
};

exports.Prisma.ProjectScalarFieldEnum = {
  id: 'id',
  name: 'name',
  description: 'description',
  status: 'status',
  priority: 'priority',
  progress: 'progress',
  startDate: 'startDate',
  endDate: 'endDate',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  tags: 'tags',
  category: 'category',
  ownerId: 'ownerId'
};

exports.Prisma.ProjectMemberScalarFieldEnum = {
  id: 'id',
  role: 'role',
  joinedAt: 'joinedAt',
  projectId: 'projectId',
  userId: 'userId'
};

exports.Prisma.OrganizationScalarFieldEnum = {
  id: 'id',
  name: 'name',
  slug: 'slug',
  logo: 'logo',
  createdAt: 'createdAt',
  metadata: 'metadata'
};

exports.Prisma.MemberScalarFieldEnum = {
  id: 'id',
  organizationId: 'organizationId',
  userId: 'userId',
  role: 'role',
  teamId: 'teamId',
  createdAt: 'createdAt'
};

exports.Prisma.InvitationScalarFieldEnum = {
  id: 'id',
  organizationId: 'organizationId',
  email: 'email',
  role: 'role',
  teamId: 'teamId',
  status: 'status',
  expiresAt: 'expiresAt',
  inviterId: 'inviterId'
};

exports.Prisma.TeamScalarFieldEnum = {
  id: 'id',
  name: 'name',
  organizationId: 'organizationId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.TeamResourceScalarFieldEnum = {
  id: 'id',
  name: 'name',
  type: 'type',
  url: 'url',
  size: 'size',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  createdById: 'createdById',
  teamId: 'teamId'
};

exports.Prisma.TeamActivityScalarFieldEnum = {
  id: 'id',
  type: 'type',
  action: 'action',
  details: 'details',
  createdAt: 'createdAt',
  userId: 'userId',
  teamId: 'teamId'
};

exports.Prisma.UserProgressScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  level: 'level',
  currentXP: 'currentXP',
  totalXP: 'totalXP',
  streakDays: 'streakDays',
  longestStreak: 'longestStreak',
  lastStreakDate: 'lastStreakDate',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.GoalScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  title: 'title',
  description: 'description',
  type: 'type',
  xpReward: 'xpReward',
  progress: 'progress',
  status: 'status',
  startDate: 'startDate',
  endDate: 'endDate',
  completedAt: 'completedAt',
  targetDate: 'targetDate',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.MilestoneScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  title: 'title',
  description: 'description',
  xpReward: 'xpReward',
  coinReward: 'coinReward',
  unlocked: 'unlocked',
  unlockedAt: 'unlockedAt',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.RewardScalarFieldEnum = {
  id: 'id',
  title: 'title',
  description: 'description',
  type: 'type',
  unlockLevel: 'unlockLevel',
  cost: 'cost',
  icon: 'icon',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.UserRewardScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  rewardId: 'rewardId',
  unlocked: 'unlocked',
  equipped: 'equipped',
  unlockedAt: 'unlockedAt',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.MoodEntryScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  mood: 'mood',
  energy: 'energy',
  note: 'note',
  date: 'date',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.FocusSessionScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  duration: 'duration',
  type: 'type',
  completed: 'completed',
  startTime: 'startTime',
  endTime: 'endTime',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.SchedulerModeScalarFieldEnum = {
  id: 'id',
  name: 'name',
  description: 'description',
  config: 'config',
  isPreferred: 'isPreferred',
  userId: 'userId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.SortOrder = {
  asc: 'asc',
  desc: 'desc'
};

exports.Prisma.NullableJsonNullValueInput = {
  DbNull: Prisma.DbNull,
  JsonNull: Prisma.JsonNull
};

exports.Prisma.JsonNullValueInput = {
  JsonNull: Prisma.JsonNull
};

exports.Prisma.QueryMode = {
  default: 'default',
  insensitive: 'insensitive'
};

exports.Prisma.NullsOrder = {
  first: 'first',
  last: 'last'
};

exports.Prisma.JsonNullValueFilter = {
  DbNull: Prisma.DbNull,
  JsonNull: Prisma.JsonNull,
  AnyNull: Prisma.AnyNull
};
exports.GoalType = exports.$Enums.GoalType = {
  DAILY: 'DAILY',
  WEEKLY: 'WEEKLY',
  MONTHLY: 'MONTHLY',
  MILESTONE: 'MILESTONE'
};

exports.RewardType = exports.$Enums.RewardType = {
  THEME: 'THEME',
  AVATAR: 'AVATAR',
  BADGE: 'BADGE',
  POWER_UP: 'POWER_UP',
  TITLE: 'TITLE',
  BACKGROUND: 'BACKGROUND',
  WIDGET: 'WIDGET',
  FEATURE: 'FEATURE'
};

exports.Prisma.ModelName = {
  User: 'User',
  Session: 'Session',
  Account: 'Account',
  Verification: 'Verification',
  TwoFactor: 'TwoFactor',
  Subscription: 'Subscription',
  Task: 'Task',
  TaskResource: 'TaskResource',
  TaskAssignment: 'TaskAssignment',
  Friendship: 'Friendship',
  Chat: 'Chat',
  ChatParticipant: 'ChatParticipant',
  Message: 'Message',
  Project: 'Project',
  ProjectMember: 'ProjectMember',
  Organization: 'Organization',
  Member: 'Member',
  Invitation: 'Invitation',
  Team: 'Team',
  TeamResource: 'TeamResource',
  TeamActivity: 'TeamActivity',
  UserProgress: 'UserProgress',
  Goal: 'Goal',
  Milestone: 'Milestone',
  Reward: 'Reward',
  UserReward: 'UserReward',
  MoodEntry: 'MoodEntry',
  FocusSession: 'FocusSession',
  SchedulerMode: 'SchedulerMode'
};

/**
 * This is a stub Prisma Client that will error at runtime if called.
 */
class PrismaClient {
  constructor() {
    return new Proxy(this, {
      get(target, prop) {
        let message
        const runtime = getRuntime()
        if (runtime.isEdge) {
          message = `PrismaClient is not configured to run in ${runtime.prettyName}. In order to run Prisma Client on edge runtime, either:
- Use Prisma Accelerate: https://pris.ly/d/accelerate
- Use Driver Adapters: https://pris.ly/d/driver-adapters
`;
        } else {
          message = 'PrismaClient is unable to run in this browser environment, or has been bundled for the browser (running in `' + runtime.prettyName + '`).'
        }

        message += `
If this is unexpected, please open an issue: https://pris.ly/prisma-prisma-bug-report`

        throw new Error(message)
      }
    })
  }
}

exports.PrismaClient = PrismaClient

Object.assign(exports, Prisma)
