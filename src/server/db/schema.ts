import {
  pgTable,
  uuid,
  text,
  integer,
  boolean,
  timestamp,
  jsonb,
  real,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";

export const accounts = pgTable("accounts", {
  id: uuid("id").defaultRandom().primaryKey(),
  stripeAccountId: text("stripe_account_id").unique().notNull(),
  stripeRefreshToken: text("stripe_refresh_token"),
  companyName: text("company_name"),
  plan: text("plan").default("starter"),
  onboardedAt: timestamp("onboarded_at", { withTimezone: true }),
  settings: jsonb("settings").default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const subscriptions = pgTable(
  "subscriptions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    accountId: uuid("account_id")
      .references(() => accounts.id)
      .notNull(),
    stripeSubscriptionId: text("stripe_subscription_id").notNull(),
    stripeCustomerId: text("stripe_customer_id").notNull(),
    customerEmail: text("customer_email"),
    customerName: text("customer_name"),
    mrrCents: integer("mrr_cents"),
    status: text("status"),
    currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    uniqueIndex("subscriptions_account_stripe_unique").on(
      table.accountId,
      table.stripeSubscriptionId
    ),
  ]
);

export const paymentEvents = pgTable(
  "payment_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    accountId: uuid("account_id")
      .references(() => accounts.id)
      .notNull(),
    subscriptionId: uuid("subscription_id").references(
      () => subscriptions.id
    ),
    stripeInvoiceId: text("stripe_invoice_id").notNull(),
    stripeEventId: text("stripe_event_id").unique().notNull(),
    eventType: text("event_type").notNull(),
    declineCode: text("decline_code"),
    declineType: text("decline_type"),
    amountCents: integer("amount_cents"),
    currency: text("currency").default("usd"),
    attemptCount: integer("attempt_count").default(1),
    nextPaymentAttempt: timestamp("next_payment_attempt", {
      withTimezone: true,
    }),
    rawPayload: jsonb("raw_payload"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index("payment_events_account_created_idx").on(
      table.accountId,
      table.createdAt
    ),
  ]
);

export const retryAttempts = pgTable(
  "retry_attempts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    paymentEventId: uuid("payment_event_id")
      .references(() => paymentEvents.id)
      .notNull(),
    accountId: uuid("account_id")
      .references(() => accounts.id)
      .notNull(),
    scheduledAt: timestamp("scheduled_at", { withTimezone: true }).notNull(),
    executedAt: timestamp("executed_at", { withTimezone: true }),
    result: text("result").default("pending"),
    stripeChargeId: text("stripe_charge_id"),
    declineCode: text("decline_code"),
    modelScore: real("model_score"),
    strategy: text("strategy").default("heuristic"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index("retry_attempts_scheduled_result_idx").on(
      table.scheduledAt,
      table.result
    ),
  ]
);

export const dunningMessages = pgTable("dunning_messages", {
  id: uuid("id").defaultRandom().primaryKey(),
  paymentEventId: uuid("payment_event_id")
    .references(() => paymentEvents.id)
    .notNull(),
  accountId: uuid("account_id")
    .references(() => accounts.id)
    .notNull(),
  channel: text("channel").notNull(),
  templateId: text("template_id"),
  sentAt: timestamp("sent_at", { withTimezone: true }),
  openedAt: timestamp("opened_at", { withTimezone: true }),
  clickedAt: timestamp("clicked_at", { withTimezone: true }),
  status: text("status").default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const recoveryResults = pgTable("recovery_results", {
  id: uuid("id").defaultRandom().primaryKey(),
  paymentEventId: uuid("payment_event_id")
    .references(() => paymentEvents.id)
    .unique()
    .notNull(),
  accountId: uuid("account_id")
    .references(() => accounts.id)
    .notNull(),
  recovered: boolean("recovered").default(false),
  recoveredAt: timestamp("recovered_at", { withTimezone: true }),
  recoveredAmountCents: integer("recovered_amount_cents"),
  recoveryMethod: text("recovery_method"),
  totalRetryAttempts: integer("total_retry_attempts"),
  totalDunningMessages: integer("total_dunning_messages"),
  timeToRecoveryHours: real("time_to_recovery_hours"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const dunningTemplates = pgTable("dunning_templates", {
  id: uuid("id").defaultRandom().primaryKey(),
  accountId: uuid("account_id")
    .references(() => accounts.id)
    .notNull(),
  name: text("name").notNull(),
  channel: text("channel").notNull(),
  subject: text("subject"),
  body: text("body").notNull(),
  stepNumber: integer("step_number"),
  delayHours: integer("delay_hours"),
  active: boolean("active").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});
